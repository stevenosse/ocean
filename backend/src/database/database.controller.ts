import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ManagedDatabase, DatabaseBackup } from '@prisma/client';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { DatabaseTunnelingService } from './database-tunneling.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('database')
@UseGuards(JwtAuthGuard)
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly databaseTunnelingService: DatabaseTunnelingService
  ) { }

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
    const directConnectionString = await this.databaseService.getDatabaseConnectionString(Number(id));
    
    if (this.databaseService.isDirectConnectionPossible()) {
      return { connectionString: directConnectionString };
    }
    
    const tunnelConnectionString = await this.databaseTunnelingService.createTunnel(Number(id));
    return { connectionString: tunnelConnectionString };
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
  
  @Post(':id/tunnel')
  async createTunnel(
    @Param('id', ParseIntPipe) id: number,
    @Query('localPort') localPort?: number
  ): Promise<{ tunnelConnectionString: string }> {
    const tunnelConnectionString = await this.databaseTunnelingService.createTunnel(id, localPort);
    return { tunnelConnectionString };
  }
  
  @Delete(':id/tunnel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async stopTunnel(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.databaseTunnelingService.stopTunnel(id);
  }
  
  @Get(':id/tunnel')
  async getTunnelConnectionString(@Param('id', ParseIntPipe) id: number): Promise<{ tunnelConnectionString: string | null }> {
    const tunnelConnectionString = await this.databaseTunnelingService.getTunnelConnectionString(id);
    return { tunnelConnectionString };
  }
  
  @Get(':id/tunnel/status')
  async isTunnelActive(@Param('id', ParseIntPipe) id: number): Promise<{ isActive: boolean }> {
    const isActive = await this.databaseTunnelingService.isTunnelActive(id);
    return { isActive };
  }
  
  @Post(':id/tunnel/restart')
  async restartTunnel(
    @Param('id', ParseIntPipe) id: number,
    @Query('localPort') localPort?: number
  ): Promise<{ tunnelConnectionString: string }> {
    const tunnelConnectionString = await this.databaseTunnelingService.restartTunnel(id, localPort);
    return { tunnelConnectionString };
  }
}
