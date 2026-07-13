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

import { isPointInBoundary } from '../spatial/utils/spatial-helpers';

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

  private async hasUserSubmitted(formId: number, userId: number, orgId: number): Promise<boolean> {
    const existing = await this.responseRepository.findOne({
      where: { formId, userId, organizationId: orgId, status: 'SUBMITTED' },
    });
    return !!existing;
  }

  async createDraft(
    formId: number,
    gps: { latitude?: number; longitude?: number; lat?: number; lng?: number } | undefined,
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

    if (await this.hasUserSubmitted(formId, user.id, orgId)) {
      throw new ForbiddenException('You have already submitted this form.');
    }

    const settings = (form.settings || {}) as { restrictByLocation?: boolean };
    const lat = gps?.latitude ?? gps?.lat;
    const lng = gps?.longitude ?? gps?.lng;
    
    console.log(`\n--- LOCATION VALIDATION DEBUG (DRAFT) ---`);
    console.log(`restrictByLocation: ${settings.restrictByLocation}`);
    console.log(`Stored Boundary:`, JSON.stringify(form.boundary));
    
    // Check location restriction
    if (settings.restrictByLocation === true) {
      console.log(`User Location: { lat: ${lat}, lng: ${lng} }`);
      
      if (lat === undefined || lng === undefined) {
        console.log(`Validation Result: NO GPS PROVIDED`);
        console.log(`Returning 403 Forbidden`);
        throw new ForbiddenException("You must be inside the configured location to submit this form.");
      }
      
      const point: [number, number] = [lng, lat]; // GeoJSON expects [lng, lat]
      
      let isInside = false;
      if (!form.boundary) {
        isInside = true;
      } else {
        // Output debug logs closer to the format requested
        console.log(`Calculated Position (GeoJSON check): executing isPointInBoundary...`);
        isInside = isPointInBoundary(point, form.boundary);
      }
      
      console.log(`Validation Result: ${isInside ? 'INSIDE' : 'OUTSIDE'}`);
      
      if (!isInside) {
        console.log(`Returning 403 Forbidden`);
        throw new ForbiddenException("You must be inside the configured location to submit this form.");
      }
    }

    const draft = this.responseRepository.create({
      formId,
      userId: user.id,
      organizationId: orgId,
      status: 'DRAFT',
      latitude: lat || null,
      longitude: lng || null,
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

    const whereClause: any = { id, organizationId: orgId };
    if (user.role === 'USER') {
      whereClause.userId = user.id;
    }

    const response = await this.responseRepository.findOne({
      where: whereClause,
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
      formId: form.id,
      formTitle: form.title,
      sections,
    };
  }

  async submitResponse(
    id: number,
    gps: { latitude?: number; longitude?: number; lat?: number; lng?: number } | undefined,
    user: any
  ): Promise<Response> {
    const orgId = this.getOrgId(user);

    const response = await this.responseRepository.findOne({
      where: { id, organizationId: orgId },
      relations: ['form'],
    });
    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }

    if (response.status === 'SUBMITTED') {
      throw new BadRequestException('Response already submitted');
    }

    if (await this.hasUserSubmitted(response.formId, user.id, orgId)) {
      throw new ForbiddenException('You have already submitted this form.');
    }

    const form = response.form;
    const settings = (form?.settings || {}) as { restrictByLocation?: boolean };
    
    console.log(`\n--- LOCATION VALIDATION DEBUG (SUBMIT) ---`);
    console.log(`restrictByLocation: ${settings.restrictByLocation}`);
    console.log(`Stored Boundary:`, JSON.stringify(form.boundary));
    
    // Check location restriction again on submit using the live gps
    if (settings.restrictByLocation === true) {
      const lat = gps?.latitude ?? gps?.lat;
      const lng = gps?.longitude ?? gps?.lng;
      console.log(`User Location: { lat: ${lat}, lng: ${lng} }`);
      
      if (lat === null || lng === null || lat === undefined || lng === undefined) {
        console.log(`Validation Result: NO GPS PROVIDED`);
        console.log(`Returning 403 Forbidden`);
        throw new ForbiddenException("You must be inside the configured location to submit this form.");
      }
      
      const point: [number, number] = [lng, lat];
      
      let isInside = false;
      if (!form.boundary) {
        isInside = true;
      } else {
        // Log boundary check details
        const geojson = form.boundary?.geojson || form.boundary;
        console.log(`Boundary Type:`, geojson?.type, `Features:`, geojson?.features?.length);
        isInside = isPointInBoundary(point, form.boundary);
      }
      
      console.log(`Validation Result: ${isInside ? 'INSIDE' : 'OUTSIDE'}`);
      
      if (!isInside) {
        console.log(`Returning 403 Forbidden`);
        throw new ForbiddenException("You must be inside the configured location to submit this form.");
      }

      // Update response coordinates with the final submission coordinates
      response.latitude = lat;
      response.longitude = lng;
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

  async findMySubmissions(user: any) {
    const orgId = this.getOrgId(user);

    const query = this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.form', 'form')
      .select([
        'response.id',
        'response.formId',
        'response.status',
        'response.submittedAt',
        'response.createdAt',
        'form.id',
        'form.title',
      ])
      .where('response.organizationId = :orgId', { orgId })
      .andWhere('response.userId = :userId', { userId: user.id })
      .andWhere('response.status = :status', { status: 'SUBMITTED' })
      .orderBy('response.submittedAt', 'DESC');

    const dbResponses = await query.getMany();
    return dbResponses;
  }
}
