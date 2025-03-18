export interface GithubAppConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
}

export const githubConfig: GithubAppConfig = {
  appId: process.env.GITHUB_APP_ID || '',
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY || '',
  clientId: process.env.GITHUB_APP_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || '',
  webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET || '',
};