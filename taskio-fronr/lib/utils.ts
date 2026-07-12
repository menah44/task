import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasQuestions(form: any): boolean {
  if (!form) return false;
  
  let questionCount = 0;

  if (form.sections && Array.isArray(form.sections)) {
    for (const sec of form.sections) {
      if (sec.questions && Array.isArray(sec.questions)) {
        questionCount += sec.questions.length;
      }
    }
  }

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
