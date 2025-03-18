export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Project {
  id: number;
  name: string;
  repositoryUrl: string;
  branch?: string;
  rootFolder?: string;
  dockerComposeFile?: string;
  dockerServiceName?: string;
  active: boolean;
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: number;
  projectId: number;
  project?: Project;
  commitHash: string;
  commitMessage?: string;
  status: DeploymentStatus;
  logs?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}