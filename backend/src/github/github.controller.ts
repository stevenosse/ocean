import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { GithubService } from './github.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('install')
  @Redirect()
  async installApp(@Query('projectId') projectId: string) {
    const project = await this.projectsService.findOne(+projectId);
    const { owner, repo } = this.githubService.extractOwnerAndRepo(project.repositoryUrl);
    
    // Get installation URL from GitHub service
    const installationUrl = this.githubService.getInstallationUrl();
    
    return { url: installationUrl, statusCode: 302 };
  }

  @Get('callback')
  async handleCallback(@Query('installation_id') installationId: string, @Query('projectId') projectId: string) {
    if (!installationId || !projectId) {
      throw new Error('Missing required parameters');
    }

    // Update project with installation ID
    await this.projectsService.update(+projectId, { githubInstallationId: +installationId });

    // Redirect back to project page
    return { url: `/projects/${projectId}`, statusCode: 302 };
  }
}