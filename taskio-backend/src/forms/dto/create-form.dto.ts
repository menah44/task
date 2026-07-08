import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormDto {
  @ApiProperty({ description: 'The unique title of the form' })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Optional description of the form',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
