import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from '../forms/entities/response.entity';
import { Form } from '../forms/entities/form.entity';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    private readonly auditService: AuditService,
  ) {}

  private getOrgId(user: any): number {
    const orgId = user.orgId || (user.organization && user.organization.id);
    if (!orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return orgId;
  }

  async createDraft(
    formId: number,
    gps: { latitude?: number; longitude?: number } | undefined,
    user: any,
  ): Promise<Response> {
    const orgId = this.getOrgId(user);

    // Verify form exists and belongs to same organization
    const form = await this.formRepository.findOne({
      where: { id: formId, organizationId: orgId },
    });
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    const draft = this.responseRepository.create({
      formId,
      userId: user.id,
      organizationId: orgId,
      status: 'DRAFT',
      latitude: gps?.latitude || null,
      longitude: gps?.longitude || null,
      answers: {},
    });

    return this.responseRepository.save(draft);
  }

  async saveAnswers(id: number, answers: any, user: any): Promise<Response> {
    const orgId = this.getOrgId(user);

    const response = await this.responseRepository.findOne({
      where: { id, organizationId: orgId },
    });
    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }

    if (response.status === 'SUBMITTED') {
      throw new BadRequestException('Cannot edit a response that has already been submitted');
    }

    response.answers = answers;
    return this.responseRepository.save(response);
  }

  async findOneFull(id: number, user: any) {
    const orgId = this.getOrgId(user);

    const response = await this.responseRepository.findOne({
      where: { id, organizationId: orgId },
      relations: ['form', 'form.sections', 'form.sections.questions'],
    });

    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }

    const form = response.form;
    const answersMap = response.answers || {};

    const sections = (form.sections || []).map((sec) => {
      const answers = (sec.questions || []).map((q) => {
        return {
          questionId: String(q.id),
          label: q.label,
          required: q.required,
          value: answersMap[q.id] !== undefined ? answersMap[q.id] : null,
        };
      });

      return {
        id: String(sec.id),
        title: sec.title,
        answers,
      };
    });

    return {
      id: response.id,
      formTitle: form.title,
      sections,
    };
  }

  async submitResponse(id: number, user: any): Promise<Response> {
    const orgId = this.getOrgId(user);

    const response = await this.responseRepository.findOne({
      where: { id, organizationId: orgId },
    });
    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }

    if (response.status === 'SUBMITTED') {
      throw new BadRequestException('Response already submitted');
    }

    response.status = 'SUBMITTED';
    response.submittedAt = new Date();

    const savedResponse = await this.responseRepository.save(response);

    try {
      const dbUser = new User();
      dbUser.id = user.id;
      dbUser.email = user.email;
      dbUser.role = user.role;
      dbUser.organization = { id: orgId } as any;

      await this.auditService.logAction(
        dbUser,
        'SUBMIT_RESPONSE',
        'FORM',
        String(response.formId),
        { responseId: response.id },
      );
    } catch (e) {
      console.error('Failed to log submission action:', e);
    }

    return savedResponse;
  }

  async findAll(formId: number | undefined, user: any) {
    const orgId = this.getOrgId(user);

    const query = this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.form', 'form')
      .leftJoin('user', 'u', 'u.id = response.userId')
      .select([
        'response.id',
        'response.formId',
        'response.status',
        'response.submittedAt',
        'response.latitude',
        'response.longitude',
        'response.createdAt',
        'form.id',
        'form.title',
        'u.id',
        'u.email',
        'u.firstName',
        'u.lastName',
      ])
      .where('response.organizationId = :orgId', { orgId });

    if (formId) {
      query.andWhere('response.formId = :formId', { formId });
    }

    // Only show submitted responses to the admin
    query.andWhere('response.status = :status', { status: 'SUBMITTED' });

    query.orderBy('response.submittedAt', 'DESC');

    const dbResponses = await query.getRawAndEntities();

    // Map raw query results to clean objects including user email
    return dbResponses.entities.map((entity) => {
      // Find raw row to get user email
      const rawRow = dbResponses.raw.find((r) => r.response_id === entity.id);
      return {
        ...entity,
        user: rawRow
          ? {
              id: rawRow.u_id,
              email: rawRow.u_email,
              firstName: rawRow.u_firstName,
              lastName: rawRow.u_lastName,
            }
          : null,
      };
    });
  }
}
