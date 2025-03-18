import { Injectable } from '@nestjs/common';
import { githubConfig } from '../config/github.config';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private octokit: Octokit;

  constructor() {
    this.initializeOctokit();
  }

  private async initializeOctokit() {
    const auth = createAppAuth({
      appId: githubConfig.appId,
      // privateKey: Buffer.from(githubConfig.privateKey, 'base64').toString('utf8'),
      privateKey: githubConfig.privateKey.replace(/\\n/g, '\n'),
      clientId: githubConfig.clientId,
      clientSecret: githubConfig.clientSecret,
    });

    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: githubConfig.appId,
        privateKey: githubConfig.privateKey.replace(/\\n/g, '\n'),
        clientId: githubConfig.clientId,
        clientSecret: githubConfig.clientSecret,
      }
    });
  }

  async getInstallationToken(owner: string, repo: string): Promise<string> {
    try {
      // Get the installation ID for the repository
      const { data: installation } = await this.octokit.apps.getRepoInstallation({
        owner,
        repo,
      });

      // Create an installation access token
      const { data: { token } } = await this.octokit.apps.createInstallationAccessToken({
        installation_id: installation.id,
      });

      return token;
    } catch (error) {
      throw new Error(`Failed to get installation token: ${error.message}`);
    }
  }

  extractOwnerAndRepo(repositoryUrl: string): { owner: string; repo: string } {
    const match = repositoryUrl.match(/github\.com[\/:]([\w-]+)\/([\w-]+)(?:\.git)?$/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2] };
  }

  getInstallationUrl(): string {
    // GitHub requires the app's slug name, not the numeric ID
    if (!githubConfig.appSlug) {
      console.warn('GitHub App slug is not configured. Using default value "ocean-deploy"');
      console.warn('Set GITHUB_APP_SLUG in your .env file to fix this issue');
    }
    
    const appSlug = githubConfig.appSlug || 'ocean-deploy';
    const url = `https://github.com/apps/${appSlug}/installations/new`;
    console.log(`GitHub installation URL: ${url}`);
    return url;
  }

  async getInstallationId(owner: string, repo: string): Promise<number | null> {
    try {
      const { data: installation } = await this.octokit.apps.getRepoInstallation({
        owner,
        repo,
      });
      return installation.id;
    } catch (error) {
      return null;
    }
  }
}