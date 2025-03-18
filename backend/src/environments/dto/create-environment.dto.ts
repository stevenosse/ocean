import { IsString, IsBoolean, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEnvironmentDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsBoolean()
  @IsOptional()
  isSecret: boolean = false;
}
