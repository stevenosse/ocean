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
      privateKey: githubConfig.privateKey,
      clientId: githubConfig.clientId,
      clientSecret: githubConfig.clientSecret,
    });

    this.octokit = new Octokit({
      auth,
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
}