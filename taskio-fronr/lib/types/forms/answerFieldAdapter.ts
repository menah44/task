import {
  AnswerQuestion,
  QuestionType as AnswerQuestionType,
} from "@/components/AnswerField";
import { Question, QuestionType } from "@/lib/types/form";

/**
 * Maps our builder/fill QuestionType -> AnswerField's internal QuestionType.
 * Single source of truth so builder preview and the real fill page can
 * never drift out of sync with each other.
 */
export function toAnswerType(type: QuestionType): AnswerQuestionType {
  switch (type) {
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "radio":
    case "select":
      return "SINGLE_CHOICE";
    case "checkbox":
      return "MULTI_CHOICE";
    case "boolean":
      return "BOOLEAN";
    case "geopoint":
      return "GEOPOINT";
    case "file":
      return "FILE"; // NEW — requires "FILE" added to AnswerQuestionType in AnswerField.tsx
    default:
      return "TEXT";
  }
}

export function toAnswerQuestion(q: Question): AnswerQuestion {
  return {
    id: q.id,
    type: toAnswerType(q.type),
    label: q.label,
    required: q.required,
    placeholder: q.placeholder,
    options: q.options,
    // NEW — only meaningful for type === "file", ignored otherwise.
    // Requires maxSizeBytes/accept added to the AnswerQuestion interface
    // in AnswerField.tsx.
    maxSizeBytes: q.maxSizeBytes,
    accept: q.accept,
  };
}

/** Options a question exposes as possible answer values (for conditional rules) */
export function questionOptionValues(q: Question): string[] | null {
  if (q.type === "radio" || q.type === "select" || q.type === "checkbox") {
    return q.options ?? [];
  }
  if (q.type === "boolean") {
    return ["true", "false"];
  }
  return null;
}
