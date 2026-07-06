import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationAdminDto } from './dto/create-organization-admin.dto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  async assertSlugUnique(slug: string): Promise<void> {
    const existing = await this.organizationsRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(
        `Organization with slug '${slug}' already exists.`,
      );
    }
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    currentUser?: User,
  ): Promise<Organization> {
    await this.assertSlugUnique(createOrganizationDto.slug);

    const organization = this.organizationsRepository.create(
      createOrganizationDto,
    );
    const savedOrganization =
      await this.organizationsRepository.save(organization);

    this.eventEmitter.emit('org.created', savedOrganization);

    await this.auditService.logAction(
      currentUser,
      'CREATE_ORGANIZATION',
      'ORGANIZATION',
      String(savedOrganization.id),
      { slug: savedOrganization.slug }
    );

    return savedOrganization;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.organizationsRepository.createQueryBuilder('organization')
      .loadRelationCountAndMap('organization.usersCount', 'organization.users')
      .orderBy('organization.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }
    const result: any = { ...organization };
    result.usersCount = organization.users?.length || 0;
    return result;
  }

  async createAdmin(id: number, dto: CreateOrganizationAdminDto, currentUser?: User) {
    const organization = await this.findOne(id);
    const result = await this.usersService.createOrganizationAdmin(organization, dto);
    
    await this.auditService.logAction(
      currentUser,
      'CREATE_ORGANIZATION_ADMIN',
      'ORGANIZATION',
      String(id),
      { email: dto.email }
    );

    return result;
  }

  async update(
    id: number,
    updateDto: UpdateOrganizationDto,
    currentUser?: User,
  ): Promise<Organization> {
    const organization = await this.findOne(id);

    // Explicitly update only fields provided in the DTO (guarantees slug is immutable)
    Object.assign(organization, updateDto);
    const savedOrganization = await this.organizationsRepository.save(organization);

    await this.auditService.logAction(
      currentUser,
      'UPDATE_ORGANIZATION',
      'ORGANIZATION',
      String(savedOrganization.id),
      { changes: updateDto }
    );

    return savedOrganization;
  }

  async deactivate(id: number, currentUser?: User): Promise<Organization> {
    const organization = await this.findOne(id);

    if (!organization.isActive) {
      throw new ConflictException(
        `Organization with ID ${id} is already deactivated.`,
      );
    }

    organization.isActive = false;
    const savedOrg = await this.organizationsRepository.save(organization);

    this.eventEmitter.emit('org.deactivated', savedOrg);

    await this.auditService.logAction(
      currentUser,
      'DEACTIVATE_ORGANIZATION',
      'ORGANIZATION',
      String(savedOrg.id),
      { status: 'deactivated' }
    );

    return savedOrg;
  }
}
