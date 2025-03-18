import { Module, forwardRef } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { ProjectsModule } from '../projects/projects.module';
import { GithubService } from 'src/github/github.service';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, GithubService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}