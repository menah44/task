import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private eventEmitter: EventEmitter2,
  ) {}

  async assertSlugUnique(slug: string): Promise<void> {
    const existing = await this.organizationsRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Organization with slug '${slug}' already exists.`);
    }
  }

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    await this.assertSlugUnique(createOrganizationDto.slug);

    const organization = this.organizationsRepository.create(createOrganizationDto);
    const savedOrganization = await this.organizationsRepository.save(organization);

    this.eventEmitter.emit('org.created', savedOrganization);

    return savedOrganization;
  }
}
