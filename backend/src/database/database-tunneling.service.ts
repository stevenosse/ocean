import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseTunnelingService {
  private readonly logger = new Logger(DatabaseTunnelingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a tunnel for a database
   * @param databaseId The database ID
   * @param localPort The local port to use (default: 5432)
   * @returns The tunnel connection string
   */
  async createTunnel(databaseId: number, localPort: number = 5432): Promise<string> {
    this.logger.log(`Creating database tunnel for database ${databaseId} on local port ${localPort}`);

    try {
      await this.stopTunnel(databaseId);

      const database = await this.prisma.managedDatabase.findUnique({
        where: { id: databaseId },
      });

      if (!database) {
        throw new Error(`Database with ID ${databaseId} not found`);
      }

      const scriptPath = path.join(process.cwd(), 'scripts/setup-db-tunnel.sh');
      const command = `${scriptPath} ${databaseId} ${localPort}`;

      // Add a timeout of 30 seconds for the script execution
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

      if (stderr) {
        this.logger.warn(`Database tunnel script stderr: ${stderr}`);
      }

      // Extract the connection string from the output
      const connectionStringMatch = stdout.match(/Remote database connection string: (postgresql:\/\/[^\n]+)/);
      if (connectionStringMatch && connectionStringMatch[1]) {
        const tunnelConnectionString = connectionStringMatch[1];
        
        // Update the database with the tunnel connection string
        await this.prisma.managedDatabase.update({
          where: { id: databaseId },
          data: { 
            tunnelConnectionString: tunnelConnectionString 
          },
        });

        this.logger.log(`Database tunnel created for database ${databaseId}`);
        return tunnelConnectionString;
      } else {
        throw new Error('No tunnel connection string was obtained from database tunnel setup');
      }
    } catch (error) {
      this.logger.error(`Failed to create database tunnel for database ${databaseId}: ${error.message}`, error.stack);
      throw new Error(`Failed to create database tunnel: ${error.message}`);
    }
  }

  /**
   * Stop a tunnel for a database
   * @param databaseId The database ID
   */
  async stopTunnel(databaseId: number): Promise<void> {
    try {
      const stopScriptPath = path.join(process.cwd(), 'scripts/stop-db-tunnel.sh');
      const { stdout, stderr } = await execAsync(`${stopScriptPath} ${databaseId}`, { timeout: 15000 });
      if (stderr) {
        this.logger.warn(`Stop database tunnel script stderr: ${stderr}`);
      }
      this.logger.log(`Stopped database tunnel for database ${databaseId}: ${stdout}`);
      
      // Clear the tunnel connection string
      await this.prisma.managedDatabase.update({
        where: { id: databaseId },
        data: { tunnelConnectionString: null },
      });
    } catch (error) {
      this.logger.warn(`Failed to stop database tunnel for database ${databaseId}: ${error.message}`);
    }
  }

  /**
   * Check if a tunnel is active for a database
   * @param databaseId The database ID
   * @returns True if the tunnel is active, false otherwise
   */
  async isTunnelActive(databaseId: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`pgrep -f "ssh.*ocean-db-${databaseId}"`, { timeout: 5000 });
      return !!stdout.trim();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the tunnel connection string for a database
   * @param databaseId The database ID
   * @returns The tunnel connection string or null if not found
   */
  async getTunnelConnectionString(databaseId: number): Promise<string | null> {
    const database = await this.prisma.managedDatabase.findUnique({
      where: { id: databaseId },
      select: { tunnelConnectionString: true },
    });

    return database?.tunnelConnectionString || null;
  }

  /**
   * Restart a tunnel for a database
   * @param databaseId The database ID
   * @param localPort The local port to use (default: 5432)
   * @returns The new tunnel connection string
   */
  async restartTunnel(databaseId: number, localPort: number = 5432): Promise<string> {
    await this.stopTunnel(databaseId);
    return await this.createTunnel(databaseId, localPort);
  }
}