import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsModule } from '../deployments/deployments.module';
import { GithubModule } from '../github/github.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ProjectsModule,
    DeploymentsModule,
    GithubModule,
    PrismaModule
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply raw body middleware only to the GitHub webhook endpoint
    consumer
      .apply((req, res, next) => {
        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk.toString();
        });
        req.on('end', () => {
          req.rawBody = rawBody;
          next();
        });
      })
      .forRoutes({ path: 'webhooks/github', method: RequestMethod.POST });
  }
}