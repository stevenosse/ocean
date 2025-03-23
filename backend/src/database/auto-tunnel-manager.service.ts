import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseTunnelingService } from './database-tunneling.service';
import { ManagedDatabase } from '@prisma/client';

@Injectable()
export class AutoTunnelManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoTunnelManagerService.name);
  private activeTunnels: Map<number, { lastAccessed: Date }> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  
  // Tunnel will be kept alive for 30 minutes after last access
  private readonly TUNNEL_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  // Check for idle tunnels every 5 minutes
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tunnelService: DatabaseTunnelingService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Auto Tunnel Manager');
    // Start the cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupIdleTunnels(), this.CLEANUP_INTERVAL_MS);
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Auto Tunnel Manager');
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Stop all active tunnels
    const databaseIds = Array.from(this.activeTunnels.keys());
    for (const databaseId of databaseIds) {
      try {
        await this.tunnelService.stopTunnel(databaseId);
        this.logger.log(`Stopped tunnel for database ${databaseId} during shutdown`);
      } catch (error) {
        this.logger.error(`Failed to stop tunnel for database ${databaseId} during shutdown: ${error.message}`);
      }
    }
  }

  /**
   * Ensures a tunnel exists for the specified database
   * If a tunnel doesn't exist, it will be created
   * @param databaseId The database ID
   * @returns The tunnel connection string
   */
  async ensureTunnelExists(databaseId: number): Promise<string> {
    // Check if tunnel is already active
    const isActive = await this.tunnelService.isTunnelActive(databaseId);
    
    let tunnelConnectionString: string | null = null;
    
    if (isActive) {
      // Tunnel exists, get the connection string
      tunnelConnectionString = await this.tunnelService.getTunnelConnectionString(databaseId);
      
      // If for some reason the connection string is missing but tunnel is active,
      // restart the tunnel to ensure consistency
      if (!tunnelConnectionString) {
        this.logger.warn(`Tunnel for database ${databaseId} is active but connection string is missing, restarting tunnel`);
        tunnelConnectionString = await this.tunnelService.restartTunnel(databaseId);
      }
    } else {
      // Tunnel doesn't exist, create it
      this.logger.log(`Creating new tunnel for database ${databaseId}`);
      tunnelConnectionString = await this.tunnelService.createTunnel(databaseId);
    }
    
    // Update the last accessed time
    this.activeTunnels.set(databaseId, { lastAccessed: new Date() });
    
    return tunnelConnectionString;
  }

  /**
   * Updates the last accessed time for a database tunnel
   * @param databaseId The database ID
   */
  updateLastAccessed(databaseId: number): void {
    if (this.activeTunnels.has(databaseId)) {
      this.activeTunnels.set(databaseId, { lastAccessed: new Date() });
    }
  }

  /**
   * Cleans up idle tunnels that haven't been accessed for a while
   */
  private async cleanupIdleTunnels(): Promise<void> {
    const now = new Date();
    const databaseIds = Array.from(this.activeTunnels.keys());
    
    for (const databaseId of databaseIds) {
      const tunnelInfo = this.activeTunnels.get(databaseId);
      if (!tunnelInfo) continue;
      
      const idleTime = now.getTime() - tunnelInfo.lastAccessed.getTime();
      
      if (idleTime > this.TUNNEL_IDLE_TIMEOUT_MS) {
        try {
          this.logger.log(`Stopping idle tunnel for database ${databaseId} (idle for ${Math.round(idleTime / 60000)} minutes)`);
          await this.tunnelService.stopTunnel(databaseId);
          this.activeTunnels.delete(databaseId);
        } catch (error) {
          this.logger.error(`Failed to stop idle tunnel for database ${databaseId}: ${error.message}`);
        }
      }
    }
  }
}