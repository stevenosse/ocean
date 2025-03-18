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
    if (!projectId) {
      throw new Error('Missing project ID');
    }
    
    const project = await this.projectsService.findOne(+projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    const { owner, repo } = this.githubService.extractOwnerAndRepo(project.repositoryUrl);
    
    // Get installation URL from GitHub service and append state parameter with project ID
    const baseUrl = this.githubService.getInstallationUrl();
    const installationUrl = `${baseUrl}?state=${projectId}`;
    
    return { url: installationUrl, statusCode: 302 };
  }

  @Get('callback')
  @Redirect()
  async handleCallback(
    @Query('installation_id') installationId: string, 
    @Query('state') state: string
  ) {
    if (!installationId || !state) {
      throw new Error('Missing required parameters');
    }

    // The state parameter contains the project ID
    const projectId = state;

    // Update project with installation ID
    await this.projectsService.update(+projectId, { githubInstallationId: +installationId });

    // Redirect back to project page in the frontend
    return { url: `/projects/${projectId}`, statusCode: 302 };
  }
}