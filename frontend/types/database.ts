export interface ManagedDatabase {
  id: number;
  name: string;
  projectId: number;
  status: string;
  host: string;
  port: number;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  backups?: DatabaseBackup[];
}

export interface DatabaseBackup {
  id: number;
  databaseId: number;
  size: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatabaseDto {
  name: string;
  projectId: number;
}

export interface ConnectionStringResponse {
  connectionString: string;
}
