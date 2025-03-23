import { User, AuthResponse } from './user'
import { ManagedDatabase, DatabaseBackup, CreateDatabaseDto, ConnectionStringResponse } from './database'

export { User, AuthResponse, ManagedDatabase, DatabaseBackup, CreateDatabaseDto, ConnectionStringResponse }

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
  buildCommand?: string;
  startCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  applicationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id?: number;
  projectId: number;
  key: string;
  value: string;
  isSecret: boolean;
  createdAt?: string;
  updatedAt?: string;
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