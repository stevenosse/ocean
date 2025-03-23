import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Deployment } from '@prisma/client';
import { ContainerHealthService } from './container-health.service';

@Injectable()
export class ContainerMonitorService {
  private readonly logger = new Logger(ContainerMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly containerHealthService: ContainerHealthService
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorContainers() {
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

      for (const deployment of latestDeployments) {
        await this.checkContainerHealth(deployment);
      }
    } catch (error) {
      this.logger.error('Error monitoring containers:', error);
    }
  }

  async checkContainerHealth(deployment: Deployment) {
    await this.containerHealthService.checkContainerHealth(deployment.id);
  }
}
