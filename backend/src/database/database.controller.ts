import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ManagedDatabase, DatabaseBackup } from '@prisma/client';
import { CreateDatabaseDto } from './dto/create-database.dto';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) { }

  @Post()
  async createDatabase(
    @Body() createDatabaseDto: CreateDatabaseDto
  ): Promise<ManagedDatabase> {
    return this.databaseService.createDatabase(createDatabaseDto);
  }

  @Get()
  async listDatabases(
    @Query('projectId') projectId?: string
  ): Promise<ManagedDatabase[]> {
    return this.databaseService.listDatabases(projectId ? Number(projectId) : undefined);
  }

  @Get(':id')
  async getDatabase(@Param('id') id: string): Promise<ManagedDatabase> {
    return this.databaseService.getDatabase(Number(id));
  }

  @Get(':id/connection-string')
  async getDatabaseConnectionString(@Param('id') id: string): Promise<{ connectionString: string }> {
    const connectionString = await this.databaseService.getDatabaseConnectionString(Number(id));
    return { connectionString };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDatabase(@Param('id') id: string): Promise<void> {
    return this.databaseService.deleteDatabase(Number(id));
  }

  @Post(':id/backup')
  async createBackup(@Param('id') id: string): Promise<DatabaseBackup> {
    return this.databaseService.createBackup(Number(id));
  }
  
  @Get(':id/backups')
  async listBackups(@Param('id') id: string): Promise<DatabaseBackup[]> {
    return this.databaseService.listBackups(Number(id));
  }
  
  @Get('backups/:id')
  async getBackup(@Param('id') id: string): Promise<DatabaseBackup> {
    return this.databaseService.getBackup(Number(id));
  }
  
  @Post('backups/:id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restoreBackup(@Param('id') id: string): Promise<void> {
    return this.databaseService.restoreBackup(Number(id));
  }
  
  @Delete('backups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBackup(@Param('id') id: string): Promise<void> {
    return this.databaseService.deleteBackup(Number(id));
  }
}
