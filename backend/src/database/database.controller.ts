import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ManagedDatabase } from '@prisma/client';
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
    @Query('projectId') projectId?: number
  ): Promise<ManagedDatabase[]> {
    return this.databaseService.listDatabases(projectId);
  }

  @Get(':id')
  async getDatabase(@Param('id') id: string): Promise<ManagedDatabase> {
    return this.databaseService.getDatabase(Number(id));
  }

  @Delete(':id')
  async deleteDatabase(@Param('id') id: string): Promise<void> {
    return this.databaseService.deleteDatabase(Number(id));
  }

  @Post(':id/backup')
  async createBackup(@Param('id') id: string): Promise<void> {
    return this.databaseService.createBackup(Number(id));
  }
}
