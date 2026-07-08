import { IsObject, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PointDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class ContainsDto {
  @IsObject()
  polygon!: any;

  @IsObject()
  @ValidateNested()
  @Type(() => PointDto)
  point!: PointDto;
}
