import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Deployment } from '@prisma/client';
import { ContainerHealthService } from './container-health.service';

@Injectable()
export class ContainerMonitorService {
  private readonly logger = new Logger(ContainerMonitorService.name);
  private isMonitoring = false;
  private readonly activeMonitoring = new Map<number, boolean>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly containerHealthService: ContainerHealthService
  ) { }

  onApplicationShutdown() {
    this.isMonitoring = false;
    this.activeMonitoring.clear();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorContainers() {
    if (this.isMonitoring) {
      this.logger.debug('Previous monitoring cycle still running, skipping...');
      return;
    }

    this.isMonitoring = true;
    this.logger.log('Running container health check...');

    try {
      const latestDeployments: [Deployment] = await this.prisma.$queryRaw`
        SELECT d.* FROM deployments d
        INNER JOIN (
          SELECT project_id, MAX(id) as max_id
          FROM deployments
          WHERE monitoring_enabled = true
            AND container_name IS NOT NULL
            AND status = 'completed'
          GROUP BY project_id
        ) latest ON d.id = latest.max_id
      `;

      this.logger.log(`Found ${latestDeployments.length} latest deployments to monitor`);

      // Clean up monitoring for deployments that are no longer active
      for (const [deploymentId] of this.activeMonitoring) {
        if (!latestDeployments.some(d => d.id === deploymentId)) {
          this.activeMonitoring.delete(deploymentId);
        }
      }

      for (const deployment of latestDeployments) {
        if (!this.activeMonitoring.has(deployment.id)) {
          this.activeMonitoring.set(deployment.id, true);
        }
        await this.checkContainerHealth(deployment);
      }
    } catch (error) {
      this.logger.error('Error monitoring containers:', error);
    } finally {
      this.isMonitoring = false;
    }
  }

  async checkContainerHealth(deployment: Deployment) {
    if (!this.activeMonitoring.get(deployment.id)) {
      return;
    }
    
    await this.containerHealthService.checkContainerHealth(deployment.id);
  }

  stopMonitoring(deploymentId: number) {
    this.activeMonitoring.delete(deploymentId);
  }
}
