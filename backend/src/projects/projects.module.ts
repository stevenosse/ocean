import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { DeploymentsModule } from '../deployments/deployments.module';
import { EnvironmentsModule } from '../environments/environments.module';

@Module({
  imports: [
    forwardRef(() => DeploymentsModule),
    forwardRef(() => EnvironmentsModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}