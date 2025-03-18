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

  @IsBoolean()
  @IsOptional()
  active: boolean;

  @IsString()
  @IsOptional()
  webhookSecret: string;
}