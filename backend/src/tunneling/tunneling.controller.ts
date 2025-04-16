import { Controller, Get, Post, Param, Query, Delete, ParseIntPipe, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { TunnelingService } from './tunneling.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('tunneling')
@ApiTags('tunneling')
@UseGuards(JwtAuthGuard)
export class TunnelingController {
  constructor(private readonly tunnelingService: TunnelingService) {}

  @Post(':projectId/create')
  @ApiOperation({ summary: 'Create a tunnel for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'port', description: 'Port to tunnel', required: true })

  async createTunnel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('port', ParseIntPipe) port: number,
  ) {
    try {
      const tunnelUrl = await this.tunnelingService.createTunnel(projectId, port);
      return { success: true, tunnelUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create tunnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':projectId/stop')
  @ApiOperation({ summary: 'Stop a tunnel for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async stopTunnel(@Param('projectId', ParseIntPipe) projectId: number) {
    try {
      await this.tunnelingService.stopTunnel(projectId);
      return { success: true, message: 'Tunnel stopped successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to stop tunnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':projectId/url')
  @ApiOperation({ summary: 'Get the tunnel URL for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTunnelUrl(@Param('projectId', ParseIntPipe) projectId: number) {
    try {
      const tunnelUrl = await this.tunnelingService.getTunnelUrl(projectId);
      return { success: true, tunnelUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get tunnel URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':projectId/status')
  @ApiOperation({ summary: 'Check if a tunnel is active for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async isTunnelActive(@Param('projectId', ParseIntPipe) projectId: number) {
    try {
      const isActive = await this.tunnelingService.isTunnelActive(projectId);
      return { success: true, isActive };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check tunnel status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':projectId/restart')
  @ApiOperation({ summary: 'Restart a tunnel for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'port', description: 'Port to tunnel', required: true })
  async restartTunnel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('port', ParseIntPipe) port: number,
  ) {
    try {
      const tunnelUrl = await this.tunnelingService.restartTunnel(projectId, port);
      return { success: true, tunnelUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to restart tunnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}