import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateDeploymentDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsOptional()
  commitHash?: string;

  @IsString()
  @IsOptional()
  commitMessage?: string;
}