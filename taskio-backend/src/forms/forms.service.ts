import { isElevatedRole } from '../auth/auth.utils';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Form } from './entities/form.entity';
import { FormVersion } from './entities/form-version.entity';
import { Section } from './entities/section.entity';
import { Response as FormResponse } from './entities/response.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { createSnapshot, mapSectionsForCopy } from './utils/form-helpers';
import { DataSource } from 'typeorm';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormVersion)
    private readonly formVersionRepository: Repository<FormVersion>,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
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

    let finalTitle = createFormDto.title;
    let counter = 2;
    while (
      await this.formRepository.findOne({
        where: { title: finalTitle, organizationId: orgId },
      })
    ) {
      finalTitle = `${createFormDto.title} (${counter})`;
      counter++;
    }

    const form = this.formRepository.create({
      ...createFormDto,
      title: finalTitle,
      organizationId: orgId,
      creatorId: user.id,
      status: 'DRAFT',
      version: 1,
      isPublic: false,
      schema: { pages: [{ id: 'page-1', title: 'Page 1', elements: [] }] },
      settings: {},
    });

    const savedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'CREATE_FORM',
      'FORM',
      String(savedForm.id),
      { title: savedForm.title },
    );

    return savedForm;
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 0,
    status?: string,
    search?: string,
  ) {
    const orgId = this.getOrgId(user);
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const where: any = { organizationId: orgId };
    const userRole = user.role?.toUpperCase();
    if (!isElevatedRole(user.role)) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const findOptions: any = {
      where,
      order: { updatedAt: 'DESC' },
      relations: ['sections', 'sections.questions'],
    };

    if (limit > 0) {
      findOptions.skip = skip;
      findOptions.take = limit;
    }

    const [data, total] = await this.formRepository.findAndCount(findOptions);

    const formIds = data.map((f) => f.id);
    let counts: { formId: number; count: string }[] = [];
    if (formIds.length > 0) {
      counts = await this.dataSource
        .getRepository(FormResponse)
        .createQueryBuilder('response')
        .select('response.formId', 'formId')
        .addSelect('COUNT(response.id)', 'count')
        .where('response.formId IN (:...formIds)', { formIds })
        .andWhere('response.status = :status', { status: 'SUBMITTED' })
        .groupBy('response.formId')
        .getRawMany();
    }
    const countMap = new Map<number, number>();
    counts.forEach((c) => countMap.set(c.formId, parseInt(c.count, 10)));

    // Map permissions dynamically for frontend
    const mappedData = data.map((form) => ({
      ...form,
      submissions: countMap.get(form.id) || 0,
      permissions: {
        canEdit: form.status.toUpperCase() !== 'ARCHIVED',
        canView: true,
        canDelete: true,
      },
    }));

    return {
      items: mappedData,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
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

  async createVersion(
    id: number,
    user: User,
  ): Promise<{ newFormId: number; versionNumber: number }> {
    return this.dataSource.transaction(async (manager) => {
      const orgId = this.getOrgId(user);
      const originalForm = await manager.getRepository(Form).findOne({
        where: { id, organizationId: orgId },
        relations: ['sections', 'sections.questions'],
      });

      if (!originalForm) {
        throw new NotFoundException(`Form with ID ${id} not found`);
      }

      // Find the maximum existing version number to determine next versionNumber
      const maxVersionRecord = await manager
        .getRepository(FormVersion)
        .findOne({
          where: { formId: originalForm.id },
          order: { version: 'DESC' },
        });
      const nextVersionNumber = maxVersionRecord
        ? maxVersionRecord.version + 1
        : 1;

      const snapshot = createSnapshot(originalForm);

      const formVersion = manager.getRepository(FormVersion).create({
        formId: originalForm.id,
        version: nextVersionNumber,
        snapshot,
        createdById: user.id,
      });
      await manager.getRepository(FormVersion).save(formVersion);

      const newTitle = `${originalForm.title} (Copy)`;

      // Ensure title uniqueness just in case
      let counter = 1;
      let tempTitle = newTitle;
      while (
        await manager.getRepository(Form).findOne({
          where: {
            title: tempTitle,
            organizationId: originalForm.organizationId,
          },
        })
      ) {
        tempTitle = `${newTitle} (${counter})`;
        counter++;
      }

      const copiedForm = manager.getRepository(Form).create({
        title: tempTitle,
        description: originalForm.description,
        status: 'DRAFT',
        isPublic: false,
        version: 1, // Copy starts fresh as version 1
        schema: originalForm.schema,
        settings: originalForm.settings,
        organizationId: originalForm.organizationId,
        creatorId: user.id,
        sections: mapSectionsForCopy(originalForm.sections),
      });

      const savedForm = await manager.getRepository(Form).save(copiedForm);

      await this.auditService.logAction(
        user,
        'CREATE_VERSION',
        'FORM',
        String(savedForm.id),
        { originalFormId: id, newVersionNumber: nextVersionNumber },
      );

      return { newFormId: savedForm.id, versionNumber: nextVersionNumber };
    });
  }

  async getVersions(id: number, user: User): Promise<FormVersion[]> {
    const form = await this.findOne(id, user);
    return this.formVersionRepository.find({
      where: { formId: form.id },
      select: {
        id: true,
        formId: true,
        version: true,
        createdAt: true,
        createdById: true,
        createdBy: {
          id: true,
          email: true,
          role: true,
        },
      },
      relations: {
        createdBy: true,
      },
      order: { version: 'DESC' },
    });
  }

  async getVersionSnapshot(
    id: number,
    versionNumber: number,
    user: User,
  ): Promise<Record<string, unknown>> {
    const form = await this.findOne(id, user);
    const versionRecord = await this.formVersionRepository.findOne({
      where: { formId: form.id, version: versionNumber },
    });

    if (!versionRecord) {
      throw new NotFoundException(
        `Version ${versionNumber} for Form ${id} not found`,
      );
    }

    return versionRecord.snapshot as Record<string, unknown>;
  }

  async update(
    id: number,
    updateFormDto: UpdateFormDto,
    user: User,
  ): Promise<Form> {
    console.log(`[FormsService] PUT /forms/${id} received`);
    return this.dataSource.transaction(async (manager) => {
      const orgId = this.getOrgId(user);
      console.log(`[FormsService] Loading form ${id} for org ${orgId}...`);
      const form = await manager.getRepository(Form).findOne({
        where: { id, organizationId: orgId },
        relations: ['sections', 'sections.questions'],
      });
      console.log(`[FormsService] Form loaded: ${form ? 'yes' : 'no'}`);

      if (!form) {
        throw new NotFoundException(`Form with ID ${id} not found`);
      }

      if (form.status.toUpperCase() === 'ARCHIVED') {
        throw new BadRequestException('Updating an ARCHIVED form is blocked');
      }

      if (form.status.toUpperCase() === 'PUBLISHED') {
        if (updateFormDto.sections || updateFormDto.schema) {
          console.log(
            `[FormsService] Validation failed: cannot modify sections of published form`,
          );
          throw new BadRequestException(
            'Cannot modify the structure (sections/schema) of a PUBLISHED form.',
          );
        }
      }

      if (updateFormDto.title && updateFormDto.title !== form.title) {
        console.log(
          `[FormsService] Validating unique title: ${updateFormDto.title}`,
        );
        // Title unique per organization validation
        const existing = await manager.getRepository(Form).findOne({
          where: {
            title: updateFormDto.title,
            organizationId: form.organizationId,
          },
        });
        if (existing && existing.id !== form.id) {
          throw new ConflictException(
            'Form title must be unique per organization',
          );
        }
      }

      if (updateFormDto.status) {
        updateFormDto.status = updateFormDto.status.toUpperCase();
      }

      const { sections, settings, ...rest } = updateFormDto;
      console.log(`[FormsService] Updating settings and rest...`);
      Object.assign(form, rest);

      if (settings) {
        form.settings = {
          ...(form.settings || {}),
          ...settings,
        };
      }

      if (sections) {
        console.log(`[FormsService] Deleting old sections...`);
        // Delete all old sections (PostgreSQL cascade deletes questions)
        await manager.getRepository(Section).delete({ formId: form.id });
        // Map and set new sections
        console.log(`[FormsService] Mapping new sections...`);
        form.sections = mapSectionsForCopy(sections);
      }

      console.log(`[FormsService] Saving entity...`);
      const updatedForm = await manager.getRepository(Form).save(form);
      console.log(`[FormsService] Database save completed`);

      console.log(`[FormsService] Logging audit action...`);
      await this.auditService.logAction(
        user,
        'UPDATE_FORM',
        'FORM',
        String(updatedForm.id),
        updateFormDto,
      );
      console.log(`[FormsService] Audit log completed. Returning response...`);

      return updatedForm;
    });
  }

  async delete(id: number, user: User): Promise<{ success: boolean }> {
    const form = await this.findOne(id, user);

    // Call softRemove to perform cascade soft deletion (retains relations on Form soft delete)
    await this.formRepository.softRemove(form);

    await this.auditService.logAction(user, 'DELETE_FORM', 'FORM', String(id), {
      title: form.title,
    });

    return { success: true };
  }

  async updateStatus(
    id: number,
    nextStatus: string,
    user: User,
  ): Promise<Form> {
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
      throw new BadRequestException(
        `Status transition from ${current} to ${next} is not allowed`,
      );
    }

    if (next === 'PUBLISHED') {
      const hasQuestions = await this.hasQuestions(form);
      if (!hasQuestions) {
        throw new UnprocessableEntityException(
          'Form must contain at least one question to be published',
        );
      }
      form.isPublic = true;
      this.eventEmitter.emit('form.published', {
        formId: form.id,
        title: form.title,
      });
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
      { status: next },
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
      throw new BadRequestException(
        'Updating an ARCHIVED form settings is blocked',
      );
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
      { settings },
    );

    return updatedForm;
  }

  async findPublicForms(): Promise<Form[]> {
    return this.formRepository.find({
      where: { isPublic: true, status: 'PUBLISHED' },
      order: { updatedAt: 'DESC' },
      relations: ['sections', 'sections.questions'],
    });
  }

  async getBoundary(
    id: number,
    user: User,
  ): Promise<Record<string, unknown> | null> {
    const form = await this.findOne(id, user);
    if (!form.boundary) {
      return { boundary: null };
    }
    return form.boundary as Record<string, unknown>;
  }

  async updateBoundary(
    id: number,
    boundary: Record<string, unknown>,
    user: User,
  ): Promise<Form> {
    const form = await this.findOne(id, user);
    if (form.status.toUpperCase() === 'ARCHIVED') {
      throw new BadRequestException(
        'Updating an ARCHIVED form boundary is blocked',
      );
    }
    form.boundary = boundary;
    const updatedForm = await this.formRepository.save(form);

    await this.auditService.logAction(
      user,
      'UPDATE_FORM_BOUNDARY',
      'FORM',
      String(form.id),
      { boundary },
    );

    return updatedForm;
  }
}
