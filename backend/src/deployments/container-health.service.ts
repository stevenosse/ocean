import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';

const execAsync = promisify(exec);

@Injectable()
export class ContainerHealthService {
  private readonly logger = new Logger(ContainerHealthService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 10000; // 10 seconds
  private readonly STARTUP_GRACE_PERIOD = 30000; // 30 seconds grace period for startup

  constructor(private readonly prisma: PrismaService) {}

  async checkContainerHealth(deployment: any) {
    const { id, containerName, containerPort } = deployment;

    try {
      // Check if container is running
      const { stdout } = await execAsync(`docker inspect --format='{{json .State}}' ${containerName}`);
      const containerState = JSON.parse(stdout.trim());
      const containerStatus = containerState.Status;

      this.logger.debug(`Container ${containerName} status: ${containerStatus}, Health: ${containerState.Health?.Status || 'no healthcheck'}`);

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
        return;
      }

      // Check if within startup grace period
      const startupTime = deployment.lastHealthCheck
        ? Date.now() - new Date(deployment.lastHealthCheck).getTime()
        : Infinity;
      if (startupTime < this.STARTUP_GRACE_PERIOD) {
        this.logger.debug(`Container ${containerName} is within startup grace period (${Math.round(startupTime / 1000)}s/${this.STARTUP_GRACE_PERIOD / 1000}s)`);
        return;
      }

      // Check Docker's built-in health status if available
      if (containerState.Health) {
        const healthStatus = containerState.Health.Status;
        if (healthStatus === 'healthy') {
          this.logger.debug(`Container ${containerName} is healthy according to Docker healthcheck`);
          return;
        } else if (healthStatus === 'unhealthy') {
          this.logger.warn(`Container ${containerName} is running but unhealthy. Attempting to restart...`);
          await this.restartContainer(deployment);
          return;
        } else if (healthStatus === 'starting') {
          this.logger.debug(`Container ${containerName} healthcheck is still starting. Checking manually...`);
          // Fall through to manual check if still starting
        }
      }

      // Manual health check
      let isHealthy = false;
      let retries = 0;

      while (!isHealthy && retries < this.MAX_RETRIES) {
        try {
          // Try health endpoint first (expecting 2xx/3xx)
          const { stdout: healthResponse } = await execAsync(
            `curl --silent --connect-timeout 5 --max-time 10 -w "%{http_code}" http://localhost:${containerPort}/health`
          );
          const healthStatusCode = healthResponse.trim().slice(-3);

          if (healthStatusCode.match(/^[23]\d\d$/)) {
            isHealthy = true;
            this.logger.debug(`Container ${containerName} is healthy (status ${healthStatusCode} on /health)`);
          } else {
            // Fallback to root path, accepting 2xx/3xx or 404
            const { stdout: rootResponse } = await execAsync(
              `curl --silent --connect-timeout 5 --max-time 10 -w "%{http_code}" http://localhost:${containerPort}`
            );
            const rootStatusCode = rootResponse.trim().slice(-3);

            if (rootStatusCode.match(/^[23]\d\d$/) || rootStatusCode === '404') {
              isHealthy = true;
              this.logger.debug(`Container ${containerName} is healthy (status ${rootStatusCode} on /)`);
            } else {
              throw new Error(`Unexpected status code: ${rootStatusCode}`);
            }
          }
        } catch (error) {
          retries++;
          this.logger.debug(`Health check attempt ${retries}/${this.MAX_RETRIES} failed for ${containerName}: ${error.message}`);
          if (retries < this.MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          }
        }
      }

      if (!isHealthy) {
        this.logger.warn(`Container ${containerName} is running but not responding on port ${containerPort} after ${this.MAX_RETRIES} attempts. Attempting to restart...`);
        await this.restartContainer(deployment);
      }

    } catch (error) {
      this.logger.error(`Error checking container ${containerName} health:`, error);

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

  async restartContainer(deployment: any) {
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