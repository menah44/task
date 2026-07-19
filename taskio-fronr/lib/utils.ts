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

export function safeRandomUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    try {
      return window.crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
