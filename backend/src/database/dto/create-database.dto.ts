import { IsString, IsNotEmpty, IsOptional, IsInt, Matches } from 'class-validator';

export class CreateDatabaseDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Database name can only contain lowercase letters, numbers and underscores',
  })
  name: string;

  @IsOptional()
  @IsInt()
  projectId?: number;
}
