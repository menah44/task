import { OmitType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends OmitType(CreateOrganizationDto, [
  'slug',
] as const) {}
