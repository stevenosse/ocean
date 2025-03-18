import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

@Injectable()
export class ContainerMonitorService {
  private readonly logger = new Logger(ContainerMonitorService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorContainers() {
    this.logger.log('Running container health check...');

    try {
      // Get all deployments with monitoring enabled
      const deployments = await this.prisma.deployment.findMany({
        where: {
          monitoringEnabled: true,
          containerName: { not: null },
          status: 'completed'
        },
        include: {
          project: true
        }
      });

      this.logger.log(`Found ${deployments.length} deployments to monitor`);

      for (const deployment of deployments) {
        await this.checkContainerHealth(deployment);
      }
    } catch (error) {
      this.logger.error('Error monitoring containers:', error);
    }
  }

  private async checkContainerHealth(deployment: any) {
    const { id, containerName, containerPort } = deployment;

    try {
      // Check if container is running
      const { stdout } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName}`);
      const containerStatus = stdout.trim();

      this.logger.debug(`Container ${containerName} status: ${containerStatus}`);

      // Update last health check timestamp
      await this.prisma.deployment.update({
        where: { id },
        data: {
          lastHealthCheck: new Date()
        }
      });

      if (containerStatus !== 'running') {
        this.logger.warn(`Container ${containerName} is not running (status: ${containerStatus}). Attempting to restart...`);
        await this.restartContainer(deployment);
      } else {
        // Container is running, check if the application is responding
        try {
          // Try to connect to the application
          await execAsync(`wget --no-verbose --tries=1 --timeout=5 --spider http://localhost:${containerPort} || exit 1`);
          this.logger.debug(`Container ${containerName} is healthy and responding on port ${containerPort}`);
        } catch (error) {
          this.logger.warn(`Container ${containerName} is running but not responding on port ${containerPort}. Attempting to restart...`);
          await this.restartContainer(deployment);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking container ${containerName} health:`, error);
      
      // Container might not exist anymore, disable monitoring
      if (error.message.includes('No such container')) {
        this.logger.warn(`Container ${containerName} no longer exists. Disabling monitoring.`);
        await this.prisma.deployment.update({
          where: { id },
          data: {
            monitoringEnabled: false,
            status: 'failed',
            errorMessage: 'Container no longer exists'
          }
        });
      }
    }
  }

  private async restartContainer(deployment: any) {
    const { id, containerName, restartCount } = deployment;

    try {
      // Increment restart count
      const updatedDeployment = await this.prisma.deployment.update({
        where: { id },
        data: {
          restartCount: restartCount + 1
        }
      });

      // Check if we've exceeded the maximum restart attempts (5)
      if (updatedDeployment.restartCount > 5) {
        this.logger.warn(`Container ${containerName} has exceeded maximum restart attempts. Disabling monitoring.`);
        await this.prisma.deployment.update({
          where: { id },
          data: {
            monitoringEnabled: false,
            status: 'failed',
            errorMessage: 'Exceeded maximum restart attempts'
          }
        });
        return;
      }

      // Try to restart the container
      this.logger.log(`Restarting container ${containerName} (attempt ${updatedDeployment.restartCount})...`);
      await execAsync(`docker restart ${containerName}`);
      this.logger.log(`Container ${containerName} restarted successfully`);
    } catch (error) {
      this.logger.error(`Error restarting container ${containerName}:`, error);
      
      // Update deployment status
      await this.prisma.deployment.update({
        where: { id },
        data: {
          status: 'failed',
          errorMessage: `Failed to restart container: ${error.message}`
        }
      });
    }
  }
}
