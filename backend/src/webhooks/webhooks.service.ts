import { Injectable, Logger } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';
import { githubConfig } from '../config/github.config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly prisma: PrismaService
  ) { }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    if (!signature) {
      this.logger.warn('No signature provided with webhook');
      return false;
    }

    try {
      const crypto = require('crypto');

      if (!githubConfig.webhookSecret) {
        this.logger.error('No webhook secret configured');
        return false;
      }

      const hmac = crypto.createHmac('sha256', githubConfig.webhookSecret);

      const requestBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      hmac.update(requestBody);

      const digest = hmac.digest('hex');
      const expectedSignature = `sha256=${digest}`;

      const signatureHash = signature.startsWith('sha256=') ? signature : `sha256=${signature}`;
      this.logger.debug(`Expected signature: ${expectedSignature}`);
      this.logger.debug(`Received signature: ${signatureHash}`);

      if (expectedSignature === signatureHash) {
        return true;
      }

      try {
        const sigHash = signatureHash.replace('sha256=', '');
        const expHash = expectedSignature.replace('sha256=', '');

        if (sigHash.length !== expHash.length) {
          this.logger.warn(`Signature length mismatch: ${sigHash.length} vs ${expHash.length}`);
          return false;
        }

        const result = crypto.timingSafeEqual(Buffer.from(sigHash), Buffer.from(expHash));

        return result;
      } catch (error) {
        this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
        return false;
      }

    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }

  async processGithubWebhook(payload: any): Promise<any> {
    try {
      const repoUrl = payload.repository?.html_url || payload.repository?.url;
      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
      const commitHash = payload.after || '';
      const commitMessage = payload.head_commit?.message || '';
      const pusherName = payload.pusher?.name || 'unknown';
      const installationId = payload.installation?.id;

      this.logger.log(`Processing GitHub webhook for repo: ${repoUrl}, branch: ${branch}, commit: ${commitHash}`);
      if (installationId) {
        this.logger.log(`GitHub App installation ID: ${installationId}`);
      }

      if (!repoUrl) {
        throw new Error('Repository URL not found in webhook payload');
      }

      const projects = await this.prisma.project.findMany({
        where: {
          repositoryUrl: repoUrl,
          branch: branch || undefined,
          active: true
        }
      });

      if (projects.length === 0) {
        this.logger.warn(`No matching active projects found for repository ${repoUrl} and branch ${branch}`);
        return { message: 'No matching active projects found for this repository/branch' };
      }

      this.logger.log(`Found ${projects.length} matching projects for auto-deployment`);

      const deployments = [];
      for (const project of projects) {
        this.logger.log(`Creating deployment for project: ${project.name} (ID: ${project.id})`);

        const deployment = await this.deploymentsService.create({
          projectId: project.id,
          commitHash: commitHash,
          commitMessage: commitMessage,
          metadata: {
            pusher: pusherName,
            triggeredBy: 'github_webhook',
            webhookDeliveryId: payload.delivery || null,
            installationId: installationId || null
          }
        });

        deployments.push(deployment);
        this.logger.log(`Successfully created deployment ID: ${deployment.id} for project: ${project.name}`);
      }

      await this.deploymentsService.processDeployments(deployments);

      return {
        message: `Created ${deployments.length} deployment(s)`,
        deployments: deployments.map(d => ({ id: d.id, projectId: d.projectId, status: d.status })),
      };
    } catch (error) {
      this.logger.error(`Error processing GitHub webhook: ${error.message}`, error.stack);
      throw error;
    }
  }
}