import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  repositoryUrl: string;

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

  @IsOptional()
  githubInstallationId: number;

  @IsBoolean()
  @IsOptional()
  active: boolean;

}