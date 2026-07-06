import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getOrgId(user: User): number {
    if (!user.organization || !user.organization.id) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return user.organization.id;
  }

  private async hasQuestions(form: Form): Promise<boolean> {
    let questionCount = 0;

    // 1. Check sections & questions in DB
    if (form.sections) {
      for (const sec of form.sections) {
        if (sec.questions) {
          questionCount += sec.questions.length;
        }
      }
    }

    // 2. Fallback: Parse schema JSON
    if (questionCount === 0 && form.schema) {
      const schema = form.schema;
      if (Array.isArray(schema)) {
        for (const sec of schema) {
          if (sec.questions && Array.isArray(sec.questions)) {
            questionCount += sec.questions.length;
          }
        }
      } else if (schema.sections && Array.isArray(schema.sections)) {
        for (const sec of schema.sections) {
          if (sec.questions && Array.isArray(sec.questions)) {
            questionCount += sec.questions.length;
          }
        }
      } else if (schema.pages && Array.isArray(schema.pages)) {
        for (const page of schema.pages) {
          if (page.elements && Array.isArray(page.elements)) {
            questionCount += page.elements.length;
          }
        }
      }
    }

    return questionCount > 0;
  }

  async create(createFormDto: CreateFormDto, user: User): Promise<Form> {
    const orgId = this.getOrgId(user);

    // Title unique per organization validation
    const existing = await this.formRepository.findOne({
      where: { title: createFormDto.title, organizationId: orgId },
    });
    if (existing) {
      throw new ConflictException('Form title must be unique per organization');
    }

    const form = this.formRepository.create({
      ...createFormDto,
      organizationId: orgId,
      creatorId: user.id,
      status: 'DRAFT',
      version: 1,
      isPublic: false,
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

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) {
    const orgId = this.getOrgId(user);
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [data, total] = await this.formRepository.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    // Map permissions dynamically for frontend
    const mappedData = data.map(form => ({
      ...form,
      permissions: {
        canEdit: form.status.toUpperCase() !== 'ARCHIVED',
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
      relations: ['sections', 'sections.questions'],
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    return form;
  }

  async update(id: number, updateFormDto: UpdateFormDto, user: User): Promise<Form> {
    const form = await this.findOne(id, user);

    if (form.status.toUpperCase() === 'ARCHIVED') {
      throw new BadRequestException('Updating an ARCHIVED form is blocked');
    }

    if (updateFormDto.title && updateFormDto.title !== form.title) {
      // Title unique per organization validation
      const existing = await this.formRepository.findOne({
        where: { title: updateFormDto.title, organizationId: form.organizationId },
      });
      if (existing) {
        throw new ConflictException('Form title must be unique per organization');
      }
    }

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

    // Call softRemove to perform cascade soft deletion (retains relations on Form soft delete)
    await this.formRepository.softRemove(form);

    await this.auditService.logAction(
      user,
      'DELETE_FORM',
      'FORM',
      String(id),
      { title: form.title }
    );

    return { success: true };
  }

  async updateStatus(id: number, nextStatus: string, user: User): Promise<Form> {
    const form = await this.findOne(id, user);
    const current = form.status.toUpperCase();
    const next = nextStatus.toUpperCase();

    if (current === next) {
      return form;
    }

    if (current === 'ARCHIVED') {
      throw new BadRequestException('Cannot transition from ARCHIVED status');
    }

    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['PUBLISHED', 'ARCHIVED'],
      PUBLISHED: ['CLOSED', 'ARCHIVED'],
      CLOSED: ['PUBLISHED', 'ARCHIVED'],
    };

    if (!allowedTransitions[current]?.includes(next)) {
      throw new BadRequestException(`Status transition from ${current} to ${next} is not allowed`);
    }

    if (next === 'PUBLISHED') {
      const hasQuestions = await this.hasQuestions(form);
      if (!hasQuestions) {
        throw new UnprocessableEntityException('Form must contain at least one question to be published');
      }
      form.isPublic = true;
      this.eventEmitter.emit('form.published', { formId: form.id, title: form.title });
    } else if (next === 'CLOSED') {
      form.isPublic = false;
    }

    form.status = next;
    const updatedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'UPDATE_FORM_STATUS',
      'FORM',
      String(form.id),
      { status: next }
    );

    return updatedForm;
  }

  async getStatus(id: number, user: User): Promise<{ status: string }> {
    const form = await this.findOne(id, user);
    return { status: form.status };
  }

  async updateSettings(id: number, settings: any, user: User): Promise<Form> {
    const form = await this.findOne(id, user);

    if (form.status.toUpperCase() === 'ARCHIVED') {
      throw new BadRequestException('Updating an ARCHIVED form settings is blocked');
    }

    if (settings.startDate && settings.endDate) {
      const start = new Date(settings.startDate);
      const end = new Date(settings.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date formats');
      }
      if (end <= start) {
        throw new BadRequestException('endDate must be greater than startDate');
      }
    }

    form.settings = settings;
    const updatedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'UPDATE_FORM_SETTINGS',
      'FORM',
      String(form.id),
      { settings }
    );

    return updatedForm;
  }

  async findPublicForms(): Promise<Form[]> {
    return this.formRepository.find({
      where: { isPublic: true, status: 'PUBLISHED' },
      order: { updatedAt: 'DESC' },
    });
  }
}
