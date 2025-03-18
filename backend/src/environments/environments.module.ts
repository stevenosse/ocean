import { Module, forwardRef } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController } from './environments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsModule } from '../deployments/deployments.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => ProjectsModule), 
    forwardRef(() => DeploymentsModule)
  ],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
