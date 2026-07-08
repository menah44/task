import { Form } from '../entities/form.entity';

export interface QuestionSnapshot {
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface SectionSnapshot {
  title: string;
  questions: QuestionSnapshot[];
}

export interface FormSnapshot {
  title: string;
  description?: string;
  schema?: Record<string, any>;
  settings?: Record<string, any>;
  sections: SectionSnapshot[];
}

/**
 * Creates a clean JSON snapshot of a form's structure.
 * Strips primary keys, IDs, and timestamps to ensure immutability.
 */
export function createSnapshot(form: Form): FormSnapshot {
  return {
    title: form.title,
    description: form.description,
    schema: form.schema,
    settings: form.settings,
    sections:
      form.sections?.map((section) => ({
        title: section.title,
        questions:
          section.questions?.map((question) => ({
            type: question.type,
            label: question.label,
            required: question.required,
            placeholder: question.placeholder,
            options: question.options,
          })) || [],
      })) || [],
  };
}

/**
 * Maps sections and questions array to clear nested TypeORM structures
 * without referencing any existing primary keys (guaranteeing deep copy).
 */
export function mapSectionsForCopy(sections: SectionSnapshot[]): any[] {
  return (
    sections?.map((section) => ({
      title: section.title,
      questions:
        section.questions?.map((question) => ({
          type: question.type,
          label: question.label,
          required: question.required,
          placeholder: question.placeholder,
          options: question.options,
        })) || [],
    })) || []
  );
}
