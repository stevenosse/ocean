import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateDeploymentDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsOptional()
  commitHash?: string;

  @IsString()
  @IsOptional()
  commitMessage?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}