import { Controller, Get, Query, Redirect, HttpCode, HttpStatus } from '@nestjs/common';
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

    const projectId = state;

    await this.projectsService.update(+projectId, { githubInstallationId: +installationId });

    return { url: `/projects/${projectId}`, statusCode: 302 };
  }
  
  @Get('installation-url')
  @HttpCode(HttpStatus.OK)
  async getInstallationUrl() {
    const baseUrl = this.githubService.getInstallationUrl();
    return { url: baseUrl };
  }
  
  @Get('installation-status')
  @HttpCode(HttpStatus.OK)
  async getInstallationStatus(
    @Query('owner') owner: string,
    @Query('repo') repo: string
  ) {
    if (!owner || !repo) {
      return { installed: false };
    }
    
    try {
      const installationId = await this.githubService.getInstallationId(owner, repo);
      return {
        installed: !!installationId,
        installationId: installationId || undefined
      };
    } catch (error) {
      return { installed: false };
    }
  }
}