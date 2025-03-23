import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManagedDatabase, DatabaseBackup } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CreateDatabaseDto } from './dto/create-database.dto';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly backupDir = process.env.DATABASE_BACKUP_DIR || '/var/backups/ocean';

  constructor(private prisma: PrismaService) {
    this.ensureBackupDirExists();
  }

  private ensureBackupDirExists(): void {
    try {
      if (!fs.existsSync(this.backupDir)) {
        try {
          // Try to create the directory with recursive option
          fs.mkdirSync(this.backupDir, { recursive: true, mode: 0o777 });
          this.logger.log(`Created backup directory: ${this.backupDir}`);
        } catch (mkdirError) {
          // If we can't create it directly, log a more helpful error message
          this.logger.error(`Failed to create backup directory: ${mkdirError.message}`);
          this.logger.warn(`Please ensure the backup directory exists and is writable by running:\n` +
                          `sudo mkdir -p ${this.backupDir}\n` +
                          `sudo chmod 777 ${this.backupDir}`);
        }
      } else {
        // Directory exists, check if it's writable
        try {
          fs.accessSync(this.backupDir, fs.constants.W_OK);
        } catch (accessError) {
          this.logger.warn(`Backup directory exists but is not writable: ${this.backupDir}`);
          this.logger.warn(`Please ensure the backup directory is writable by running:\n` +
                          `sudo chmod 777 ${this.backupDir}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking backup directory: ${error.message}`);
    }
  }

  private async commandExists(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async createDatabase(createDatabaseDto: CreateDatabaseDto): Promise<ManagedDatabase> {
    if (!/^[a-z0-9_]+$/.test(createDatabaseDto.name)) {
      throw new BadRequestException('Database name can only contain lowercase letters, numbers and underscores');
    }

    const existingDb = await this.prisma.managedDatabase.findUnique({
      where: { name: createDatabaseDto.name }
    });

    if (existingDb) {
      throw new BadRequestException(`Database with name ${createDatabaseDto.name} already exists`);
    }

    const createdbExists = await this.commandExists('createdb');
    const psqlExists = await this.commandExists('psql');
    
    if (!createdbExists || !psqlExists) {
      const missingCommands = [];
      if (!createdbExists) missingCommands.push('createdb');
      if (!psqlExists) missingCommands.push('psql');
      
      const errorMessage = `PostgreSQL commands not found: ${missingCommands.join(', ')}. Please ensure PostgreSQL is installed and in your PATH.`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    const username = `db_${createDatabaseDto.name}`;
    const password = this.generatePassword();

    try {
      this.logger.log(`Creating database: ${createDatabaseDto.name}`);
      await execAsync(`createdb ${createDatabaseDto.name}`);
      await execAsync(`psql -c "CREATE USER ${username} WITH PASSWORD '${password}'"`);
      await execAsync(`psql -c "GRANT ALL PRIVILEGES ON DATABASE ${createDatabaseDto.name} TO ${username}"`);
      this.logger.log(`Successfully created database: ${createDatabaseDto.name}`);
    } catch (error) {
      this.logger.error(`Failed to create database: ${error.message}`);
      throw new BadRequestException('Failed to create database: ' + error.message);
    }

    return this.prisma.managedDatabase.create({
      data: {
        name: createDatabaseDto.name,
        username,
        password,
        host: 'localhost',
        port: 5432,
        projectId: createDatabaseDto.projectId
      }
    });
  }

  async listDatabases(projectId?: number): Promise<ManagedDatabase[]> {
    return this.prisma.managedDatabase.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: {
            name: true
          }
        },
        backups: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
  }

  async getDatabase(id: number): Promise<ManagedDatabase> {
    const database = await this.prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            name: true
          }
        },
        backups: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!database) {
      throw new NotFoundException(`Database with ID ${id} not found`);
    }

    return database;
  }

  async getDatabaseConnectionString(id: number): Promise<string> {
    const database = await this.getDatabase(id);
    return `postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.name}`;
  }

  async deleteDatabase(id: number): Promise<void> {
    const db = await this.getDatabase(id);

    const dropdbExists = await this.commandExists('dropdb');
    const psqlExists = await this.commandExists('psql');
    
    if (!dropdbExists || !psqlExists) {
      const missingCommands = [];
      if (!dropdbExists) missingCommands.push('dropdb');
      if (!psqlExists) missingCommands.push('psql');
      
      const errorMessage = `PostgreSQL commands not found: ${missingCommands.join(', ')}. Please ensure PostgreSQL is installed and in your PATH.`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    try {
      this.logger.log(`Deleting database: ${db.name}`);
      
      await this.createBackup(id);
      
      await execAsync(`dropdb ${db.name}`);
      await execAsync(`psql -c "DROP USER IF EXISTS ${db.username}"`);
      
      this.logger.log(`Successfully deleted database: ${db.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete database: ${error.message}`);
      throw new BadRequestException('Failed to delete database: ' + error.message);
    }

    await this.prisma.managedDatabase.delete({
      where: { id }
    });
  }

  async createBackup(databaseId: number): Promise<DatabaseBackup> {
    const db = await this.getDatabase(databaseId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${db.name}_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFilename);

    // Check if pg_dump command is available
    const pgDumpExists = await this.commandExists('pg_dump');
    
    if (!pgDumpExists) {
      const errorMessage = 'PostgreSQL command not found: pg_dump. Please ensure PostgreSQL is installed and in your PATH.';
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    // Ensure backup directory exists and is writable before proceeding
    try {
      if (!fs.existsSync(this.backupDir)) {
        try {
          fs.mkdirSync(this.backupDir, { recursive: true, mode: 0o777 });
          this.logger.log(`Created backup directory: ${this.backupDir}`);
        } catch (mkdirError) {
          const errorMessage = `Cannot create backup directory: ${mkdirError.message}. Please run: sudo mkdir -p ${this.backupDir} && sudo chmod 777 ${this.backupDir}`;
          this.logger.error(errorMessage);
          throw new BadRequestException(errorMessage);
        }
      } else {
        // Check if directory is writable
        try {
          fs.accessSync(this.backupDir, fs.constants.W_OK);
        } catch (accessError) {
          const errorMessage = `Backup directory exists but is not writable: ${this.backupDir}. Please run: sudo chmod 777 ${this.backupDir}`;
          this.logger.error(errorMessage);
          throw new BadRequestException(errorMessage);
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // Re-throw our custom exception
      }
      const errorMessage = `Error checking backup directory: ${error.message}`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    const backup = await this.prisma.databaseBackup.create({
      data: {
        databaseId,
        backupPath,
        size: 0,
        status: 'PENDING'
      }
    });

    try {
      this.logger.log(`Creating backup for database: ${db.name}`);
      
      await execAsync(`PGPASSWORD="${db.password}" pg_dump -U ${db.username} -h ${db.host} -p ${db.port} -F p -f "${backupPath}" ${db.name}`);
      
      const stats = fs.statSync(backupPath);
      const fileSizeInBytes = stats.size;
      
      const updatedBackup = await this.prisma.databaseBackup.update({
        where: { id: backup.id },
        data: {
          size: fileSizeInBytes,
          status: 'COMPLETED'
        }
      });
      
      this.logger.log(`Successfully created backup for database: ${db.name}`);
      return updatedBackup;
    } catch (error) {
      this.logger.error(`Failed to create backup: ${error.message}`);
      
      await this.prisma.databaseBackup.update({
        where: { id: backup.id },
        data: {
          status: 'FAILED'
        }
      });
      
      throw new BadRequestException('Failed to create backup: ' + error.message);
    }
  }

  async restoreBackup(backupId: number): Promise<void> {
    const backup = await this.prisma.databaseBackup.findUnique({
      where: { id: backupId },
      include: { database: true }
    });

    if (!backup) {
      throw new NotFoundException(`Backup with ID ${backupId} not found`);
    }

    const db = backup.database;

    // Check if PostgreSQL commands are available
    const dropdbExists = await this.commandExists('dropdb');
    const createdbExists = await this.commandExists('createdb');
    const psqlExists = await this.commandExists('psql');
    
    if (!dropdbExists || !createdbExists || !psqlExists) {
      const missingCommands = [];
      if (!dropdbExists) missingCommands.push('dropdb');
      if (!createdbExists) missingCommands.push('createdb');
      if (!psqlExists) missingCommands.push('psql');
      
      const errorMessage = `PostgreSQL commands not found: ${missingCommands.join(', ')}. Please ensure PostgreSQL is installed and in your PATH.`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    try {
      this.logger.log(`Restoring backup for database: ${db.name}`);
      
      await execAsync(`dropdb --if-exists ${db.name}`);
      await execAsync(`createdb ${db.name}`);
      await execAsync(`psql -c "GRANT ALL PRIVILEGES ON DATABASE ${db.name} TO ${db.username}"`);
      
      await execAsync(`PGPASSWORD="${db.password}" psql -U ${db.username} -h ${db.host} -p ${db.port} -d ${db.name} -f "${backup.backupPath}"`);
      
      this.logger.log(`Successfully restored backup for database: ${db.name}`);
    } catch (error) {
      this.logger.error(`Failed to restore backup: ${error.message}`);
      throw new BadRequestException('Failed to restore backup: ' + error.message);
    }
  }

  async listBackups(databaseId: number): Promise<DatabaseBackup[]> {
    return this.prisma.databaseBackup.findMany({
      where: { databaseId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBackup(id: number): Promise<DatabaseBackup> {
    const backup = await this.prisma.databaseBackup.findUnique({
      where: { id },
      include: { database: true }
    });

    if (!backup) {
      throw new NotFoundException(`Backup with ID ${id} not found`);
    }

    return backup;
  }

  async deleteBackup(id: number): Promise<void> {
    const backup = await this.getBackup(id);

    try {
      if (fs.existsSync(backup.backupPath)) {
        fs.unlinkSync(backup.backupPath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete backup file: ${error.message}`);
    }

    await this.prisma.databaseBackup.delete({
      where: { id }
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
