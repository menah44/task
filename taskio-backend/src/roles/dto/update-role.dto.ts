import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;
}
