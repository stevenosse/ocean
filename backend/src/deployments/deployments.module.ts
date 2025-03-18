import { Module, forwardRef } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DeploymentWorkerService } from './deployment-worker.service';
import { ProjectsModule } from '../projects/projects.module';
import { GithubService } from 'src/github/github.service';
import { EnvironmentsModule } from '../environments/environments.module';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    forwardRef(() => EnvironmentsModule),
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentWorkerService, GithubService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}