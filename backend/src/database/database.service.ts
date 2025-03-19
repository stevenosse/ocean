import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManagedDatabase } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CreateDatabaseDto } from './dto/create-database.dto';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async createDatabase(createDatabaseDto: CreateDatabaseDto): Promise<ManagedDatabase> {
    // Validate database name
    if (!/^[a-z0-9_]+$/.test(createDatabaseDto.name)) {
      throw new BadRequestException('Database name can only contain lowercase letters, numbers and underscores');
    }

    // Generate credentials
    const username = `db_${createDatabaseDto.name}`;
    const password = this.generatePassword();

    // Create database using psql
    try {
      await execAsync(`createdb ${createDatabaseDto.name}`);
      await execAsync(`psql -c "CREATE USER ${username} WITH PASSWORD '${password}'"`);
      await execAsync(`psql -c "GRANT ALL PRIVILEGES ON DATABASE ${createDatabaseDto.name} TO ${username}"`);
    } catch (error) {
      throw new BadRequestException('Failed to create database: ' + error.message);
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
      where: { projectId }
    });
  }

  async getDatabase(id: number): Promise<ManagedDatabase> {
    return this.prisma.managedDatabase.findUniqueOrThrow({
      where: { id }
    });
  }

  async deleteDatabase(id: number): Promise<void> {
    const db = await this.getDatabase(id);

    try {
      await execAsync(`dropdb ${db.name}`);
      await execAsync(`psql -c "DROP USER ${db.username}"`);
    } catch (error) {
      throw new BadRequestException('Failed to delete database: ' + error.message);
    }

    await this.prisma.managedDatabase.delete({
      where: { id }
    });
  }

  async createBackup(databaseId: number): Promise<void> {
    const db = await this.getDatabase(databaseId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `/var/backups/${db.name}_${timestamp}.sql`;

    try {
      await execAsync(`pg_dump -U ${db.username} -h ${db.host} -p ${db.port} -F c -b -v -f ${backupFile} ${db.name}`);

      await this.prisma.databaseBackup.create({
        data: {
          databaseId,
          backupPath: backupFile,
          size: 0, // TODO: Get actual size
          status: 'COMPLETED'
        }
      });
    } catch (error) {
      throw new BadRequestException('Failed to create backup: ' + error.message);
    }
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-8);
  }
}
