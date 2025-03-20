import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class SshTunnelingService {
  private readonly logger = new Logger(SshTunnelingService.name);
  private readonly remoteHost: string;
  private readonly basePort: number;

  constructor(private readonly prisma: PrismaService) {
    // Load configuration from environment variables or use defaults
    this.remoteHost = process.env.SSH_TUNNEL_HOST || 'tunnel.example.com';
    this.basePort = parseInt(process.env.SSH_TUNNEL_BASE_PORT || '10000', 10);
  }

  /**
   * Calculate a remote port based on project ID
   * This ensures each project gets a unique port
   */
  private calculateRemotePort(projectId: number): number {
    // Simple algorithm to generate a port number based on project ID
    // You can adjust this based on your needs
    return this.basePort + projectId;
  }

  /**
   * Create a tunnel for a project
   * @param projectId The project ID
   * @param port The local port to tunnel
   * @returns The tunnel URL
   */
  async createTunnel(projectId: number, port: number): Promise<string> {
    this.logger.log(`Creating SSH tunnel for project ${projectId} on port ${port}`);
    
    try {
      // First stop any existing tunnel for this project
      await this.stopTunnel(projectId);
      
      // Calculate remote port based on project ID
      const remotePort = this.calculateRemotePort(projectId);
      
      // Set up SSH tunnel for the container
      const sshScriptPath = path.join(process.cwd(), 'scripts/setup-ssh-tunnel.sh');
      const sshCommand = `${sshScriptPath} ${projectId} ${port} ${remotePort} ${this.remoteHost}`;
      
      const { stdout: sshOutput } = await execAsync(sshCommand);
      
      // Extract the tunnel URL from SSH output
      const tunnelUrlMatch = sshOutput.match(/URL: (https:\/\/[^\s]+)/);
      if (tunnelUrlMatch && tunnelUrlMatch[1]) {
        const tunnelUrl = tunnelUrlMatch[1];
        
        // Update the project's application URL in the database
        await this.prisma.project.update({
          where: { id: projectId },
          data: { applicationUrl: tunnelUrl }
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

  /**
   * Stop a tunnel for a project
   * @param projectId The project ID
   */
  async stopTunnel(projectId: number): Promise<void> {
    this.logger.log(`Stopping SSH tunnel for project ${projectId}`);
    
    try {
      const stopSshScriptPath = path.join(process.cwd(), 'scripts/stop-ssh-tunnel.sh');
      const { stdout } = await execAsync(`${stopSshScriptPath} ${projectId}`);
      this.logger.log(`Stopped SSH tunnel for project ${projectId}: ${stdout}`);
    } catch (error) {
      this.logger.warn(`Failed to stop SSH tunnel for project ${projectId}: ${error.message}`);
      // We don't throw here as this is often called before creating a new tunnel
      // and we don't want to fail if there's no existing tunnel
    }
  }

  /**
   * Check if a tunnel is active for a project
   * @param projectId The project ID
   * @returns True if the tunnel is active, false otherwise
   */
  async isTunnelActive(projectId: number): Promise<boolean> {
    try {
      // Check if SSH process is running for this project
      const { stdout } = await execAsync(`pgrep -f "ssh.*ocean-project-${projectId}"`);
      return !!stdout.trim();
    } catch (error) {
      // pgrep returns non-zero exit code if no process is found
      return false;
    }
  }

  /**
   * Get the tunnel URL for a project
   * @param projectId The project ID
   * @returns The tunnel URL or null if not found
   */
  async getTunnelUrl(projectId: number): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { applicationUrl: true }
    });
    
    return project?.applicationUrl || null;
  }

  /**
   * Restart a tunnel for a project
   * @param projectId The project ID
   * @param port The port to tunnel
   * @returns The new tunnel URL
   */
  async restartTunnel(projectId: number, port: number): Promise<string> {
    await this.stopTunnel(projectId);
    return await this.createTunnel(projectId, port);
  }
}