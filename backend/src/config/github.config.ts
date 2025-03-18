export interface GithubAppConfig {
  appId: string;
  appSlug: string; // The GitHub App's slug name used in URLs
  privateKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
}

export const githubConfig: GithubAppConfig = {
  appId: process.env.GITHUB_APP_ID || '',
  appSlug: process.env.GITHUB_APP_SLUG || 'ocean-deploy', // Default slug if not specified
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY || '',
  clientId: process.env.GITHUB_APP_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || '',
  webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET || '',
};