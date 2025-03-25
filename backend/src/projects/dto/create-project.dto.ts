import { IsString, IsOptional, IsBoolean, IsUrl, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  repositoryUrl: string;

  @IsString()
  rootFolder: string;

  @IsString()
  @IsOptional()
  branch: string;

  @IsString()
  @IsOptional()
  dockerComposeFile: string;

  @IsString()
  @IsOptional()
  dockerServiceName: string;

  @IsString()
  @IsOptional()
  webhookSecret: string;

  @IsNumber()
  @IsOptional()
  githubInstallationId: number;

  @IsBoolean()
  @IsOptional()
  active: boolean;
  
  /**
   * Command to build the project (e.g., 'npm run build')
   */
  @IsString()
  @IsOptional()
  buildCommand: string;
  
  /**
   * Command to start the project (e.g., 'npm start')
   */
  @IsString()
  @IsOptional()
  startCommand: string;
  
  /**
   * Command to install dependencies (e.g., 'npm install')
   */
  @IsString()
  @IsOptional()
  installCommand: string;
  
  /**
   * Directory where build output is located (e.g., 'dist', 'build')
   */
  @IsString()
  @IsOptional()
  outputDirectory: string;
}