import { PartialType } from '@nestjs/swagger';
import { CreateEnvironmentDto } from './create-environment.dto';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {
  @IsString()
  @IsOptional()
  value?: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;
}
