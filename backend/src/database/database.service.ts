import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
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
  private readonly backupDir = '/var/backups/ocean';

  constructor(private prisma: PrismaService) {
    // Ensure backup directory exists
    this.ensureBackupDirExists();
  }

  private ensureBackupDirExists(): void {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        this.logger.log(`Created backup directory: ${this.backupDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create backup directory: ${error.message}`);
    }
  }

  async createDatabase(createDatabaseDto: CreateDatabaseDto): Promise<ManagedDatabase> {
    // Validate database name
    if (!/^[a-z0-9_]+$/.test(createDatabaseDto.name)) {
      throw new BadRequestException('Database name can only contain lowercase letters, numbers and underscores');
    }

    // Check if database already exists
    const existingDb = await this.prisma.managedDatabase.findUnique({
      where: { name: createDatabaseDto.name }
    });

    if (existingDb) {
      throw new BadRequestException(`Database with name ${createDatabaseDto.name} already exists`);
    }

    // Generate credentials
    const username = `db_${createDatabaseDto.name}`;
    const password = this.generatePassword();

    // Create database using psql
    try {
      this.logger.log(`Creating database: ${createDatabaseDto.name}`);
      await execAsync(`createdb ${createDatabaseDto.name}`);
      await execAsync(`psql -c "CREATE USER ${username} WITH PASSWORD '${password}'"`);
      await execAsync(`psql -c "GRANT ALL PRIVILEGES ON DATABASE ${createDatabaseDto.name} TO ${username}"`);
      this.logger.log(`Successfully created database: ${createDatabaseDto.name}`);
    } catch (error) {
      this.logger.error(`Failed to create database: ${error.message}`);
      throw new InternalServerErrorException('Failed to create database: ' + error.message);
    }

    // Save to database
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

    try {
      this.logger.log(`Deleting database: ${db.name}`);
      
      // Create a final backup before deletion
      await this.createBackup(id);
      
      // Drop database and user
      await execAsync(`dropdb ${db.name}`);
      await execAsync(`psql -c "DROP USER IF EXISTS ${db.username}"`);
      
      this.logger.log(`Successfully deleted database: ${db.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete database: ${error.message}`);
      throw new BadRequestException('Failed to delete database: ' + error.message);
    }

    // Delete from database
    await this.prisma.managedDatabase.delete({
      where: { id }
    });
  }

  async createBackup(databaseId: number): Promise<DatabaseBackup> {
    const db = await this.getDatabase(databaseId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${db.name}_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFilename);

    // Create backup record in pending state
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
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(path.dirname(backupPath))) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      }

      // Execute backup command
      await execAsync(`PGPASSWORD="${db.password}" pg_dump -U ${db.username} -h ${db.host} -p ${db.port} -F p -f "${backupPath}" ${db.name}`);
      
      // Get file size
      const stats = fs.statSync(backupPath);
      const fileSizeInBytes = stats.size;
      
      // Update backup record
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
      
      // Update backup record to failed state
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

    try {
      this.logger.log(`Restoring backup for database: ${db.name}`);
      
      // Drop and recreate the database
      await execAsync(`dropdb --if-exists ${db.name}`);
      await execAsync(`createdb ${db.name}`);
      await execAsync(`psql -c "GRANT ALL PRIVILEGES ON DATABASE ${db.name} TO ${db.username}"`);
      
      // Restore from backup
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
      // Delete backup file
      if (fs.existsSync(backup.backupPath)) {
        fs.unlinkSync(backup.backupPath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete backup file: ${error.message}`);
    }

    // Delete from database
    await this.prisma.databaseBackup.delete({
      where: { id }
    });
  }

  private generatePassword(): string {
    // Generate a more secure password with 16 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
