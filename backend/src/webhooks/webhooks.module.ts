import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsModule } from '../deployments/deployments.module';

@Module({
  imports: [
    ProjectsModule,
    DeploymentsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}