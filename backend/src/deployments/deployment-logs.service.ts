import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service dedicated to handling deployment-related logs
 * Centralizes all logging functionality for deployments
 */
@Injectable()
export class DeploymentLogsService {
  private readonly logger = new Logger(DeploymentLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log database connection information
   */
  logDatabaseConnection(message: string): void {
    this.logger.log(`[DB Connection] ${message}`);
  }

  /**
   * Log host binding information
   */
  logHostBinding(message: string): void {
    this.logger.log(`[Host Binding] ${message}`);
  }

  /**
   * Log Docker container information
   */
  logDockerContainer(message: string): void {
    this.logger.log(`[Docker Container] ${message}`);
  }

  /**
   * Log deployment process information
   */
  logDeployment(message: string): void {
    this.logger.log(`[Deployment] ${message}`);
  }

  /**
   * Log port allocation information
   */
  logPortAllocation(message: string): void {
    this.logger.log(`[Port Allocation] ${message}`);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: string): void {
    if (context) {
      this.logger.debug(`[${context}] ${message}`);
    } else {
      this.logger.debug(message);
    }
  }

  /**
   * Log warning information
   */
  warn(message: string, context?: string): void {
    if (context) {
      this.logger.warn(`[${context}] ${message}`);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log error information
   */
  error(message: string, error?: Error, context?: string): void {
    if (context) {
      this.logger.error(`[${context}] ${message}`, error?.stack);
    } else {
      this.logger.error(message, error?.stack);
    }
  }

  /**
   * Log verbose information
   */
  verbose(message: string, context?: string): void {
    if (context) {
      this.logger.verbose(`[${context}] ${message}`);
    } else {
      this.logger.verbose(message);
    }
  }

  /**
   * Update the logs for a deployment in the database
   * @param deploymentId The ID of the deployment to update
   * @param logs The logs to save
   */
  async updateDeploymentLogs(deploymentId: number, logs: string): Promise<void> {
    this.debug(`Updating logs for deployment ${deploymentId}`, 'Database');
    
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { logs }
    });
  }
}
