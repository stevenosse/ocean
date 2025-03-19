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

  async checkContainerHealth(deployment: Deployment) {
    await this.containerHealthService.checkContainerHealth(deployment);
  }
}
