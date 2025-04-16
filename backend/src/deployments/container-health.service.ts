import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';
import { Deployment, DeploymentStatus } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class ContainerHealthService {
  private readonly logger = new Logger(ContainerHealthService.name);
  private readonly MAX_RETRIES = 10;
  private readonly RETRY_DELAY = 30000;
  private readonly STARTUP_GRACE_PERIOD = 120000;
  private readonly MONITORING_DURATION = 3600000;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly failureCounters = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {
    // Clean up any lingering processes on service shutdown
    process.once('beforeExit', this.cleanup.bind(this));
  }

  private cleanup() {
    this.failureCounters.clear();
    // Remove our own event listeners
    process.removeAllListeners('beforeExit');
  }

  async checkContainerHealth(deploymentId: number) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: true,
      }
    });
    const { id, containerName, containerPort } = deployment;

    try {
      // Check if container is running
      const { stdout } = await execAsync(`docker inspect --format='{{json .State}}' ${containerName}`);
      const containerState = JSON.parse(stdout.trim());
      const containerStatus = containerState.Status;

      this.logger.debug(`Container ${containerName} status: ${containerStatus}, Health: ${containerState.Health?.Status || 'no healthcheck'}`);

      await this.prisma.deployment.update({
        where: { id },
        data: {
          lastHealthCheck: new Date()
        }
      });

      // Reset failure counter on successful check
      if (containerStatus === 'running') {
        this.failureCounters.set(containerName, 0);
      }

      if (containerStatus !== 'running') {
        const failures = (this.failureCounters.get(containerName) || 0) + 1;
        this.failureCounters.set(containerName, failures);

        if (failures >= this.MAX_CONSECUTIVE_FAILURES) {
          this.logger.warn(`Container ${containerName} has failed ${failures} consecutive health checks. Attempting to restart...`);
          await this.restartContainer(deployment);
        } else {
          this.logger.warn(`Container ${containerName} is not running (status: ${containerStatus}). Failure ${failures}/${this.MAX_CONSECUTIVE_FAILURES}`);
        }
        return;
      }

      const startupTime = deployment.lastHealthCheck
        ? Date.now() - new Date(deployment.lastHealthCheck).getTime()
        : Infinity;
      if (startupTime < this.STARTUP_GRACE_PERIOD) {
        this.logger.debug(`Container ${containerName} is within startup grace period (${Math.round(startupTime / 1000)}s/${this.STARTUP_GRACE_PERIOD / 1000}s)`);
        return;
      }

      const deploymentCompletedTime = deployment.completedAt
        ? Date.now() - new Date(deployment.completedAt).getTime()
        : 0;
      if (deploymentCompletedTime > this.MONITORING_DURATION) {
        this.logger.log(`Container ${containerName} has been stable for ${Math.round(deploymentCompletedTime / 60000)} minutes. Disabling monitoring.`);
        await this.prisma.deployment.update({
          where: { id },
          data: {
            monitoringEnabled: false
          }
        });
        return;
      }

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
        }
      }

      let isHealthy = false;
      let retries = 0;

      while (!isHealthy && retries < this.MAX_RETRIES) {
        try {
          const { stdout: healthResponse } = await execAsync(
            `curl --silent --connect-timeout 5 --max-time 10 -w "%{http_code}" http://localhost:${containerPort}/health`
          );
          const healthStatusCode = healthResponse.trim().slice(-3);

          if (healthStatusCode.match(/^[23]\d\d$/)) {
            isHealthy = true;
            this.logger.debug(`Container ${containerName} is healthy (status ${healthStatusCode} on /health)`);
          } else {
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
        const deployment = await this.prisma.deployment.findUnique({
          where: { id }
        });

        if (deployment.status != DeploymentStatus.completed) {
          await this.prisma.deployment.update({
            where: { id },
            data: {
              status: 'failed',
              errorMessage: 'Container no longer exists'
            }
          });
        }
      }
    }
  }

  async restartContainer(deployment: any) {
    const { id, containerName, restartCount } = deployment;

    try {
      const updatedDeployment = await this.prisma.deployment.update({
        where: { id },
        data: {
          restartCount: restartCount + 1
        }
      });

      if (updatedDeployment.restartCount > 5) {
        this.logger.warn(`Container ${containerName} has exceeded maximum restart attempts. Disabling monitoring.`);
        if (deployment.status != DeploymentStatus.completed) {
          await this.prisma.deployment.update({
            where: { id },
            data: {
              status: 'failed',
              errorMessage: 'Container no longer exists'
            }
          });
        }
        return;
      }

      this.logger.log(`Restarting container ${containerName} (attempt ${updatedDeployment.restartCount})...`);
      await execAsync(`docker restart ${containerName}`);
      this.logger.log(`Container ${containerName} restarted successfully`);
    } catch (error) {
      this.logger.error(`Error restarting container ${containerName}:`, error);

      if (deployment.status != DeploymentStatus.completed) {
        await this.prisma.deployment.update({
          where: { id },
          data: {
            status: 'failed',
            errorMessage: 'Container no longer exists'
          }
        });
      }
    }
  }
}