import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    private readonly auditService: AuditService,
  ) {}

  private getOrgId(user: User): number {
    if (!user.organization || !user.organization.id) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return user.organization.id;
  }

  async create(createFormDto: CreateFormDto, user: User): Promise<Form> {
    const orgId = this.getOrgId(user);

    const form = this.formRepository.create({
      ...createFormDto,
      organizationId: orgId,
      creatorId: user.id,
      schema: { pages: [{ id: "page-1", title: "Page 1", elements: [] }] },
      settings: {},
    });

    const savedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'CREATE_FORM',
      'FORM',
      String(savedForm.id),
      { title: savedForm.title }
    );

    return savedForm;
  }

  async findAll(user: User, page: number = 1, limit: number = 10) {
    const orgId = this.getOrgId(user);
    const skip = (page - 1) * limit;

    const [data, total] = await this.formRepository.findAndCount({
      where: { organizationId: orgId },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    // Map permissions dynamically for frontend
    const mappedData = data.map(form => ({
      ...form,
      permissions: {
        canEdit: true,
        canView: true,
        canDelete: true,
      }
    }));

    return {
      items: mappedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, user: User): Promise<Form> {
    const orgId = this.getOrgId(user);
    const form = await this.formRepository.findOne({
      where: { id, organizationId: orgId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    return form;
  }

  async update(id: number, updateFormDto: UpdateFormDto, user: User): Promise<Form> {
    const form = await this.findOne(id, user);

    Object.assign(form, updateFormDto);
    const updatedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'UPDATE_FORM',
      'FORM',
      String(updatedForm.id),
      updateFormDto
    );

    return updatedForm;
  }

  async delete(id: number, user: User): Promise<{ success: boolean }> {
    const form = await this.findOne(id, user);

    await this.formRepository.remove(form);

    await this.auditService.logAction(
      user,
      'DELETE_FORM',
      'FORM',
      String(id),
      { title: form.title }
    );

    return { success: true };
  }
}
