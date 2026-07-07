import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../forms/entities/template.entity';
import { Form } from '../forms/entities/form.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
  ) {}

  private getOrgId(user: User): number {
    if (!user.organization || !user.organization.id) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return user.organization.id;
  }

  async createTemplateFromForm(formId: number, title: string | undefined, user: User) {
    const originalForm = await this.formRepository.findOne({
      where: { id: formId },
      relations: ['sections', 'sections.questions'],
    });

    if (!originalForm) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }

    const snapshot = {
      title: originalForm.title,
      description: originalForm.description,
      schema: originalForm.schema,
      settings: originalForm.settings,
      sections: originalForm.sections?.map(section => ({
        title: section.title,
        questions: section.questions?.map(question => ({
          type: question.type,
          label: question.label,
          required: question.required,
          placeholder: question.placeholder,
          options: question.options,
        }))
      }))
    };

    const template = this.templateRepository.create({
      title: title || originalForm.title,
      snapshot,
      createdById: user.id,
    });

    return this.templateRepository.save(template);
  }

  async createFormFromTemplate(templateId: number, user: User) {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const snapshot = template.snapshot;

    const newForm = this.formRepository.create({
      title: template.title,
      description: snapshot.description,
      status: 'DRAFT',
      isPublic: false,
      version: 1,
      schema: snapshot.schema,
      settings: snapshot.settings,
      organizationId: this.getOrgId(user),
      creatorId: user.id,
      sections: snapshot.sections?.map((section: any) => ({
        title: section.title,
        questions: section.questions?.map((question: any) => ({
          type: question.type,
          label: question.label,
          required: question.required,
          placeholder: question.placeholder,
          options: question.options,
        }))
      }))
    });

    return this.formRepository.save(newForm);
  }
}
