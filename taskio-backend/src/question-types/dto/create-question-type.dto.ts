import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionTypeDto {
  @ApiProperty({ description: 'The UI type identifier (e.g., text, radio, file)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'The UI label (e.g., Short Text, File Upload)' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Emoji or icon name to display' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'The core backend type (e.g., TEXT, MULTI_CHOICE, FILE_UPLOAD)' })
  @IsString()
  @IsNotEmpty()
  baseType: string;

  @ApiPropertyOptional({ description: 'JSON schema for custom configuration' })
  @IsObject()
  @IsOptional()
  configSchema?: any;
}
