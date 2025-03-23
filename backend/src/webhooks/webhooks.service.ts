import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { DeploymentsService } from '../deployments/deployments.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    if (!signature) {
      return true;
    }

    try {
      const repoUrl = payload.repository?.html_url || payload.repository?.url;
      if (!repoUrl) {
        return false;
      }

      const projects = await this.projectsService.findAll();
      const project = projects.find(p => p.repositoryUrl === repoUrl);

      if (!project || !project.webhookSecret) {
        return true;
      }

      const hmac = crypto.createHmac('sha256', project.webhookSecret);
      const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  async processGithubWebhook(payload: any): Promise<any> {
    try {
      const repoUrl = payload.repository?.html_url || payload.repository?.url;
      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
      
      if (!repoUrl) {
        throw new Error('Repository URL not found in webhook payload');
      }

      const projects = await this.projectsService.findAll();
      const matchingProjects = projects.filter(project => {
        const repoMatch = project.repositoryUrl === repoUrl;
        const branchMatch = !project.branch || project.branch === branch;
        return repoMatch && branchMatch && project.active;
      });

      if (matchingProjects.length === 0) {
        return { message: 'No matching active projects found for this repository/branch' };
      }

      const deployments = [];
      for (const project of matchingProjects) {
        const deployment = await this.deploymentsService.create({
          projectId: project.id,
          commitHash: payload.after || '',
          commitMessage: payload.head_commit?.message || '',
        });
        deployments.push(deployment);
      }

      return {
        message: `Created ${deployments.length} deployment(s)`,
        deployments: deployments.map(d => ({ id: d.id, projectId: d.projectId })),
      };
    } catch (error) {
      console.error('Error processing GitHub webhook:', error);
      throw error;
    }
  }
}