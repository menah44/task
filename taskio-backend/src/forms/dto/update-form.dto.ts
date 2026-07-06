import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  schema?: any;

  @IsObject()
  @IsOptional()
  settings?: any;
}
