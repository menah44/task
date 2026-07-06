import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateFormDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
