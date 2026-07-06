import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFormDto {
  @ApiProperty({ description: 'The title of the form', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Optional description of the form', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Transition status of the form',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']
  })
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'draft', 'published', 'closed', 'archived'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'JSON schema structure for sections and questions', required: false })
  @IsObject()
  @IsOptional()
  schema?: any;

  @ApiProperty({ description: 'Settings configuration like dates and response limits', required: false })
  @IsObject()
  @IsOptional()
  settings?: any;
}
