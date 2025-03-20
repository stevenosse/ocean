import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { SshTunnelingService } from './ssh-tunneling.service';

const execAsync = promisify(exec);

@Injectable()
export class TunnelingService {
  private readonly logger = new Logger(TunnelingService.name);

  constructor(
    private readonly sshTunnelingService: SshTunnelingService
  ) {}

  /**
   * Create a tunnel for a project
   * @param projectId The project ID
   * @param port The port to tunnel
   * @returns The tunnel URL
   */
  async createTunnel(projectId: number, port: number): Promise<string> {
    this.logger.log(`Creating tunnel for project ${projectId} on port ${port}`);
    
    try {
      // Use our SSH tunneling service instead of ngrok
      const tunnelUrl = await this.sshTunnelingService.createTunnel(projectId, port);
      return tunnelUrl;
    } catch (error) {
      this.logger.error(`Failed to create tunnel for project ${projectId}: ${error.message}`, error.stack);
      throw new Error(`Failed to create tunnel: ${error.message}`);
    }
  }

  /**
   * Stop a tunnel for a project
   * @param projectId The project ID
   */
  async stopTunnel(projectId: number): Promise<void> {
    this.logger.log(`Stopping tunnel for project ${projectId}`);
    
    try {
      // Use our SSH tunneling service instead of ngrok
      await this.sshTunnelingService.stopTunnel(projectId);
      this.logger.log(`Stopped tunnel for project ${projectId}`);
    } catch (error) {
      this.logger.warn(`Failed to stop tunnel for project ${projectId}: ${error.message}`);
      // We don't throw here as this is often called before creating a new tunnel
      // and we don't want to fail if there's no existing tunnel
    }
  }

  /**
   * Get the tunnel URL for a project
   * @param projectId The project ID
   * @returns The tunnel URL or null if not found
   */
  async getTunnelUrl(projectId: number): Promise<string | null> {
    return await this.sshTunnelingService.getTunnelUrl(projectId);
  }

  /**
   * Check if a tunnel is active for a project
   * @param projectId The project ID
   * @returns True if the tunnel is active, false otherwise
   */
  async isTunnelActive(projectId: number): Promise<boolean> {
    return await this.sshTunnelingService.isTunnelActive(projectId);
  }

  /**
   * Restart a tunnel for a project
   * @param projectId The project ID
   * @param port The port to tunnel
   * @returns The new tunnel URL
   */
  async restartTunnel(projectId: number, port: number): Promise<string> {
    return await this.sshTunnelingService.restartTunnel(projectId, port);
  }
}