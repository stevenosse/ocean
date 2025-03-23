import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { sanitizeForSubdomain } from './utils/string-utils';

const execAsync = promisify(exec);

@Injectable()
export class SshTunnelingService {
  private readonly logger = new Logger(SshTunnelingService.name);
  private readonly remoteHost: string;
  private readonly basePort: number;

  constructor(private readonly prisma: PrismaService) {
    this.remoteHost = process.env.SSH_TUNNEL_HOST || 'tunnel.example.com';
    this.basePort = parseInt(process.env.SSH_TUNNEL_BASE_PORT || '10000', 10);
  }

  private calculateRemotePort(projectId: number): number {
    return this.basePort + projectId;
  }

  async createTunnel(projectId: number, port: number): Promise<string> {
    this.logger.log(`Creating SSH tunnel for project ${projectId} on port ${port}`);

    try {
      await this.stopTunnel(projectId);

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const sshScriptPath = path.join(process.cwd(), 'scripts/setup-ssh-tunnel.sh');
      const sanitizedName = sanitizeForSubdomain(project.name, projectId);
      const remotePort = this.calculateRemotePort(projectId);
      const sshCommand = `${sshScriptPath} ${projectId} ${port} ${remotePort} ${this.remoteHost} "${sanitizedName}"`;

      // Add a timeout of 30 seconds for the script execution
      const { stdout: sshOutput, stderr } = await execAsync(sshCommand, { timeout: 30000 });

      if (stderr) {
        this.logger.warn(`SSH script stderr: ${stderr}`);
      }

      const tunnelUrlMatch = sshOutput.match(/URL: (https?:\/\/[^\s]+)/);
      if (tunnelUrlMatch && tunnelUrlMatch[1]) {
        const tunnelUrl = tunnelUrlMatch[1];

        await this.prisma.project.update({
          where: { id: projectId },
          data: { applicationUrl: tunnelUrl },
        });

        this.logger.log(`SSH tunnel created for project ${projectId}: ${tunnelUrl}`);
        return tunnelUrl;
      } else {
        throw new Error('No tunnel URL was obtained from SSH tunnel setup');
      }
    } catch (error) {
      this.logger.error(`Failed to create SSH tunnel for project ${projectId}: ${error.message}`, error.stack);
      throw new Error(`Failed to create SSH tunnel: ${error.message}`);
    }
  }

  async stopTunnel(projectId: number): Promise<void> {
    try {
      const stopSshScriptPath = path.join(process.cwd(), 'scripts/stop-ssh-tunnel.sh');
      const { stdout, stderr } = await execAsync(`${stopSshScriptPath} ${projectId}`, { timeout: 15000 });
      if (stderr) {
        this.logger.warn(`Stop SSH script stderr: ${stderr}`);
      }
      this.logger.log(`Stopped SSH tunnel for project ${projectId}: ${stdout}`);
    } catch (error) {
      this.logger.warn(`Failed to stop SSH tunnel for project ${projectId}: ${error.message}`);
    }
  }

  async isTunnelActive(projectId: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`pgrep -f "ssh.*ocean-project-${projectId}"`, { timeout: 5000 });
      return !!stdout.trim();
    } catch (error) {
      return false;
    }
  }

  async getTunnelUrl(projectId: number): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { applicationUrl: true },
    });

    return project?.applicationUrl || null;
  }

  async restartTunnel(projectId: number, port: number): Promise<string> {
    await this.stopTunnel(projectId);
    return await this.createTunnel(projectId, port);
  }
}