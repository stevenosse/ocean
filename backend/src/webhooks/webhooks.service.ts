import { Injectable, Logger } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { DeploymentsService } from '../deployments/deployments.service';
import { GithubService } from '../github/github.service';
import { githubConfig } from '../config/github.config';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService,
    private readonly githubService: GithubService,
  ) {}

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    if (!signature) {
      this.logger.warn('No signature provided with webhook');
      return false;
    }

    try {
      // First try to verify using the GitHub App webhook secret
      if (githubConfig.webhookSecret) {
        this.logger.debug('Verifying webhook using GitHub App webhook secret');
        const hmac = crypto.createHmac('sha256', githubConfig.webhookSecret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
        
        try {
          return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
        } catch (error) {
          this.logger.debug('GitHub App webhook verification failed, trying project-specific secret');
        }
      }

      // If GitHub App verification fails or is not configured, try project-specific webhook secret
      const repoUrl = payload.repository?.html_url || payload.repository?.url;
      if (!repoUrl) {
        this.logger.warn('No repository URL found in webhook payload');
        return false;
      }

      const projects = await this.projectsService.findAll();
      const project = projects.find(p => p.repositoryUrl === repoUrl);

      if (!project || !project.webhookSecret) {
        this.logger.debug('No project found with matching repository URL or no webhook secret configured');
        // If using GitHub App, we can be more lenient about project-specific webhook secrets
        return !!githubConfig.webhookSecret;
      }

      const hmac = crypto.createHmac('sha256', project.webhookSecret);
      const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }

  async processGithubWebhook(payload: any): Promise<any> {
    try {
      // Extract repository information from the webhook payload
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

      // Find all projects that match this repository and branch
      const projects = await this.projectsService.findAll();
      let matchingProjects = projects.filter(project => {
        const repoMatch = project.repositoryUrl === repoUrl;
        const branchMatch = !project.branch || project.branch === branch;
        return repoMatch && branchMatch && project.active;
      });

      // If no matching projects found but we have an installation ID, try to update project with installation ID
      if (matchingProjects.length === 0 && installationId && repoUrl) {
        try {
          // Find any projects with matching repo URL regardless of branch or active status
          const potentialProjects = projects.filter(p => p.repositoryUrl === repoUrl);
          
          if (potentialProjects.length > 0) {
            this.logger.log(`Found ${potentialProjects.length} potential projects to update with GitHub installation ID`);
            
            // Extract owner and repo from URL to verify installation
            const { owner, repo } = this.githubService.extractOwnerAndRepo(repoUrl);
            const validInstallation = await this.githubService.getInstallationId(owner, repo);
            
            if (validInstallation === installationId) {
              // Update projects with installation ID
              for (const project of potentialProjects) {
                // TODO: Update project with installation ID if needed
                this.logger.log(`Updating project ${project.id} with GitHub installation ID ${installationId}`);
              }
              
              // Re-filter projects now that we've updated them
              matchingProjects = potentialProjects.filter(p => (!p.branch || p.branch === branch) && p.active);
            }
          }
        } catch (error) {
          this.logger.warn(`Error updating projects with installation ID: ${error.message}`);
        }
      }

      if (matchingProjects.length === 0) {
        this.logger.warn(`No matching active projects found for repository ${repoUrl} and branch ${branch}`);
        return { message: 'No matching active projects found for this repository/branch' };
      }

      this.logger.log(`Found ${matchingProjects.length} matching projects for auto-deployment`);

      // Create deployments for all matching projects
      const deployments = [];
      for (const project of matchingProjects) {
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