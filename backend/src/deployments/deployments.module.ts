import { Module, forwardRef } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DeploymentWorkerService } from './deployment-worker.service';
import { ContainerMonitorService } from './container-monitor.service';
import { DeploymentLogsService } from './deployment-logs.service';
import { ProjectsModule } from '../projects/projects.module';
import { GithubService } from 'src/github/github.service';
import { EnvironmentsModule } from '../environments/environments.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    forwardRef(() => EnvironmentsModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentWorkerService, ContainerMonitorService, GithubService, DeploymentLogsService],
  exports: [DeploymentsService, DeploymentLogsService],
})
export class DeploymentsModule {}