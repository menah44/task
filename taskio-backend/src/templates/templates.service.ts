import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Template } from '../forms/entities/template.entity';
import { Form } from '../forms/entities/form.entity';
import { User } from '../auth/entities/user.entity';
import {
  createSnapshot,
  mapSectionsForCopy,
} from '../forms/utils/form-helpers';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    private readonly dataSource: DataSource,
  ) {}

  private getOrgId(user: User): number {
    if (!user.organization || !user.organization.id) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return user.organization.id;
  }

  async createTemplateFromForm(
    formId: number,
    title: string | undefined,
    description: string | undefined,
    user: User,
  ) {
    const orgId = this.getOrgId(user);
    const originalForm = await this.formRepository.findOne({
      where: { id: formId, organizationId: orgId },
      relations: ['sections', 'sections.questions'],
    });

    if (!originalForm) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    const snapshot = createSnapshot(originalForm);

    const template = this.templateRepository.create({
      title: title || originalForm.title,
      description: description || originalForm.description,
      snapshot,
      createdById: user.id,
    });

    return this.templateRepository.save(template);
  }

  async createFormFromTemplate(templateId: number, user: User) {
    return this.dataSource.transaction(async (manager) => {
      const template = await manager
        .getRepository(Template)
        .findOne({ where: { id: templateId } });

      if (!template) {
        throw new NotFoundException(`Template with ID ${templateId} not found`);
      }

      const snapshot = template.snapshot;

      const newForm = manager.getRepository(Form).create({
        title: template.title,
        description: template.description || snapshot.description,
        status: 'DRAFT',
        isPublic: false,
        version: 1,
        schema: snapshot.schema,
        settings: snapshot.settings,
        organizationId: this.getOrgId(user),
        creatorId: user.id,
        sections: mapSectionsForCopy(snapshot.sections),
      });

      return manager.getRepository(Form).save(newForm);
    });
  }
}
