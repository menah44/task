import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug!: string;
}
