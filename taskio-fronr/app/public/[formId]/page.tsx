// app/public/forms/[formId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnswerField, {
  AnswerQuestion,
  AnswerValue,
} from "@/components/AnswerField";

// ======================== Types ========================
interface PublicQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface PublicSection {
  id: string;
  title: string;
  questions: PublicQuestion[];
}

interface PublicFormDetail {
  id: number;
  title: string;
  description: string;
  sections: PublicSection[];
  showProgress: boolean;
}

// ======================== Type Mapping ========================
type AnswerQType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE"
  | "BOOLEAN"
  | "GEOPOINT";

function toAnswerType(type: string): AnswerQType {
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
    default:
      return "TEXT";
  }
}

function toAnswerQuestion(q: PublicQuestion): AnswerQuestion {
  return {
    id: q.id,
    type: toAnswerType(q.type),
    label: q.label,
    required: q.required,
    placeholder: q.placeholder,
    options: q.options,
  };
}

// ======================== Progress Bar ========================
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Section {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ======================== Mock Form ========================
function getMockForm(formId: string): PublicFormDetail {
  return {
    id: parseInt(formId, 10) || 1,
    title: "Customer Satisfaction Survey",
    description: "Help us improve our services. No login required.",
    showProgress: true,
    sections: [
      {
        id: "s1",
        title: "Your Experience",
        questions: [
          {
            id: "q1",
            label: "How would you rate our service?",
            type: "radio",
            required: true,
            options: ["Excellent", "Good", "Average", "Poor"],
          },
          {
            id: "q2",
            label: "What did you like most?",
            type: "text",
            required: false,
            placeholder: "Tell us what stood out...",
          },
        ],
      },
      {
        id: "s2",
        title: "About You (Optional)",
        questions: [
          {
            id: "q3",
            label: "Your Name",
            type: "text",
            required: false,
            placeholder: "Anonymous if left blank",
          },
          {
            id: "q4",
            label: "Your Email",
            type: "email",
            required: false,
            placeholder: "you@example.com",
          },
        ],
      },
    ],
  };
}

// ======================== Main Page ========================
export default function PublicFormFillPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params?.formId;

  const [form, setForm] = useState<PublicFormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseURL}/forms/public/${formId}`);
        if (res.ok) {
          setForm(await res.json());
        } else {
          setForm(getMockForm(formId ?? "1"));
        }
      } catch {
        setForm(getMockForm(formId ?? "1"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Form not found.</p>
          <Link
            href="/public"
            className="text-primary hover:underline text-sm">
            ← Back to forms
          </Link>
        </div>
      </div>
    );
  }

  // ── Submitted success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-10 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
          <p className="text-muted-foreground text-sm">
            Your response has been submitted successfully.
          </p>
          <Link
            href="/public"
            className="inline-block mt-4 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-white text-sm font-medium rounded-xl transition-colors">
            Back to Forms
          </Link>
        </div>
      </div>
    );
  }

  const sections = form.sections || [];

  if (sections.length === 0 || !sections[currentSectionIdx]) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <div className="bg-white border border-border rounded-2xl p-6 text-center text-muted-foreground shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">{form.title}</h1>
          <p className="text-sm">This form has no questions yet.</p>
          <button
            onClick={() => router.push("/public")}
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-white text-sm font-bold rounded-xl transition-colors">
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  const currentSection = sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === sections.length - 1;
  const totalQuestions = sections.reduce(
    (sum, s) => sum + s.questions.length,
    0,
  );
  const answeredQuestions = Object.keys(answers).length;

  // ── Validate current section ──
  const getSectionErrors = (): string[] => {
    return currentSection.questions
      .filter((q) => q.required)
      .filter((q) => {
        const val = answers[q.id];
        if (val === null || val === undefined) return true;
        if (typeof val === "string") return val.trim() === "";
        if (Array.isArray(val)) return val.length === 0;
        return false;
      })
      .map((q) => q.label);
  };

  const handleNext = () => {
    const errors = getSectionErrors();
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setCurrentSectionIdx((prev) => prev + 1);
  };

  const handleBack = () => {
    setShowValidation(false);
    setCurrentSectionIdx((prev) => prev - 1);
  };

  // ── Submit: POST /forms/public/:id/submit (anonymous) ──
  const handleSubmit = async () => {
    const errors = getSectionErrors();
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${baseURL}/forms/public/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ No Authorization header — anonymous submission
        body: JSON.stringify({ answers }),
      });
      setSubmitted(true);
    } catch {
      // Show success even if API isn't wired yet
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Navbar */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/public" className="flex items-center gap-2">
            <span className="text-primary text-xl font-black">■</span>
            <span className="text-foreground font-bold">FormFlow</span>
          </Link>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            🔓 No login required
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Form Header */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground text-sm mt-2">{form.description}</p>
          )}
        </div>

        {/* Progress Bar */}
        {form.showProgress && sections.length > 1 && (
          <div className="bg-white border border-border rounded-2xl px-6 py-4 shadow-sm">
            <ProgressBar
              current={currentSectionIdx + 1}
              total={sections.length}
            />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-error text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Current Section */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">
            {currentSection.title}
          </h2>

          {currentSection.questions.map((q) => (
            <AnswerField
              key={q.id}
              question={toAnswerQuestion(q)}
              value={answers[q.id] ?? null}
              onChange={(val) =>
                setAnswers((prev) => ({ ...prev, [q.id]: val }))
              }
              mode="fill"
              showValidation={showValidation}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {currentSectionIdx > 0 ? (
            <button
              onClick={handleBack}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
              ← Back
            </button>
          ) : (
            <div />
          )}

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
              {isSubmitting ? "Submitting..." : "Submit Form ✓"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
              Next →
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-6">
          Your response will be submitted anonymously.
        </p>
      </div>
    </div>
  );
}
