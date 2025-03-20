import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PrismaModule } from './prisma/prisma.module';
import { GithubModule } from './github/github.module';
import { EnvironmentsModule } from './environments/environments.module';
import { DatabaseModule } from './database/database.module';
import { TunnelingModule } from './tunneling/tunneling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GithubModule,
    PrismaModule,
    ProjectsModule,
    DeploymentsModule,
    EnvironmentsModule,
    WebhooksModule,
    DatabaseModule,
    TunnelingModule,
  ],
})
export class AppModule {}