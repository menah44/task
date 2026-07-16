// ============================================================
// Shared Form types — single source of truth for:
//   app/(authenticated)/studio/forms/[formId]/builder/page.tsx
//   app/(authenticated)/studio/forms/[formId]/fill/page.tsx
//   app/(authenticated)/studio/forms/[formId]/fill/review/page.tsx
//
// Adjust the "@/lib/types/form" import path below if your
// tsconfig path alias differs.
// ============================================================

export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "date"
  | "number"
  | "email"
  | "boolean"
  | "geopoint"
  | "file"; // NEW — file picker / drag-drop upload (FE-T403, A5-01)

/**
 * Conditional visibility rule.
 * NOTE: `showWhen` is compared with strict equality against the stored
 * answer value, so `dependsOn` should point at a question whose answer
 * is a plain string (radio / select / checkbox with a single value).
 * Boolean/geopoint questions are intentionally excluded as dependency
 * sources in the builder UI to avoid type-mismatch bugs.
 */
export interface ConditionalRule {
  dependsOn: string; // question id this question depends on
  showWhen: string; // value of the dependency that reveals this question
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditional?: ConditionalRule;
  // NEW — "file" questions only. Defaults applied by the builder are
  // 10MB / "image/*,application/pdf" (see FILE_UPLOAD_DEFAULTS in the
  // builder page). Left optional here so existing questions of other
  // types are unaffected.
  maxSizeBytes?: number;
  accept?: string;
}

/** Metadata stored against an answer once a file question's upload succeeds. */
export interface FileAnswerMetadata {
  mediaId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface FormSettings {
  showProgress: boolean;
  hasBoundary: boolean; // triggers GPS capture on the fill page
  restrictByLocation?: boolean; // forces GPS validation against boundary
  location?: { lat: number; lng: number; address?: string };
  allowedRadius?: number;
  graceRadius?: number;
  validationMode?: "STRICT" | "ALLOW_NEARBY" | "DIRECTIONS";
  requireLiveLocationOnSubmit?: boolean;
  requireHighAccuracy?: boolean;
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  showProgress: true,
  hasBoundary: false,
  restrictByLocation: false,
};

/** Full structure as returned by GET /forms/:id/structure (A2-10) */
export interface FormStructure extends FormSettings {
  id: string;
  title: string;
  description?: string;
  sections: Section[];
}

/**
 * Dev-mode substitute for the backend, used by the builder to persist
 * locally and by the fill page as a fallback when the API isn't wired
 * up yet. Once A2-10 / A2-xx builder-save endpoints exist, replace the
 * localStorage calls in both pages with real API calls — the shape
 * stays the same.
 */
export interface StoredForm {
  title: string;
  description?: string;
  settings: FormSettings;
  sections: Section[];
}

export function storageKeyForForm(formId: string) {
  return `form-${formId}`;
}

export function readLocalFormStructure(formId: string): FormStructure | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(storageKeyForForm(formId));
  return data ? JSON.parse(data) : null;
}

export function writeLocalFormStructure(
  formId: string,
  form: Omit<FormStructure, "id">,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKeyForForm(formId), JSON.stringify(form));
}

/**
 * sessionStorage key used to hand the in-progress response (form +
 * answers + GPS) from the fill page to the review page (A4-11 /
 * FE-T404), before/without a real GET /responses/:id/full round-trip.
 * Both pages must import this from here rather than redefining it
 * locally, or the keys can drift and the handoff will silently fail.
 */
export function reviewStorageKey(responseId: number | string): string {
  return `form-review:${responseId}`;
}
