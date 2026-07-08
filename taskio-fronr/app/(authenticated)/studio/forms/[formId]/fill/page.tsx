"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnswerField, { AnswerValue } from "@/components/AnswerField";
import apiClient from "@/lib/api/client";
import {
  FormStructure,
  Question,
  readLocalFormStructure,
  reviewStorageKey,
} from "@/lib/types/form";
import { toAnswerQuestion } from "@/lib/types/forms/answerFieldAdapter";

// ======================== Types ========================
interface GpsCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

// ======================== Mock Data ========================
// Last-resort fallback: used only if the real API call fails AND the
// builder hasn't saved anything locally yet (e.g. fresh env, no backend).
function getMockForm(formId: string): FormStructure {
  return {
    id: formId,
    title: "Employee Feedback Survey",
    description: "Share your thoughts to help us improve.",
    showProgress: true,
    hasBoundary: false,
    sections: [
      {
        id: "s1",
        title: "General Information",
        questions: [
          {
            id: "q1",
            label: "Full Name",
            type: "text",
            required: true,
            placeholder: "Enter your full name",
          },
          {
            id: "q2",
            label: "Department",
            type: "radio",
            required: true,
            options: ["Engineering", "HR", "Marketing", "Finance", "Other"],
          },
          {
            id: "q3",
            label: "Please specify your department",
            type: "text",
            required: false,
            placeholder: "Enter your department",
            conditional: { dependsOn: "q2", showWhen: "Other" },
          },
        ],
      },
      {
        id: "s2",
        title: "Work Experience",
        questions: [
          {
            id: "q4",
            label: "How satisfied are you with your role?",
            type: "radio",
            required: true,
            options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
          },
          {
            id: "q5",
            label: "Would you recommend this company to others?",
            type: "boolean",
            required: true,
          },
          {
            id: "q6",
            label: "Additional comments",
            type: "textarea",
            required: false,
            placeholder: "Any other feedback...",
          },
        ],
      },
    ],
  };
}

// ======================== Progress Bar ========================
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          Section {current} of {total}
        </span>
        <span className="font-medium text-blue-400">{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ======================== GPS Banner ========================
function GpsBanner({
  coords,
  loading,
  denied,
}: {
  coords: GpsCoords | null;
  loading: boolean;
  denied: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
        <span className="animate-spin">⟳</span>
        Capturing your location...
      </div>
    );
  }

  if (coords) {
    const { lat, lng, accuracy } = coords;
    const delta = 0.006; // ~600m box around the pin
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    const mapEmbedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
    const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg overflow-hidden">
        <div className="text-green-400 text-xs px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span>📍</span>
            Location captured (±{Math.round(accuracy)}m)
          </span>
          {/* Same-tab navigation by design (no target="_blank"). Note: this
              will leave the fill flow, so anything not auto-saved yet will
              be lost — surface this to users if it becomes an issue. */}
          <a
            href={mapLink}
            className="underline hover:text-green-300 whitespace-nowrap">
            Open in Maps ↗
          </a>
        </div>
        <iframe
          title="Captured location map"
          src={mapEmbedSrc}
          className="w-full h-40 border-0"
          loading="lazy"
        />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
        <span>⚠️</span>
        Couldn&apos;t access your location. Check your browser&apos;s location
        permission for this site and try again.
      </div>
    );
  }

  return null;
}

// ======================== Auto-save indicator ========================
function AutoSaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") return null;
  return (
    <span
      className={`text-[10px] font-medium ${
        status === "saving"
          ? "text-gray-400 animate-pulse"
          : status === "saved"
            ? "text-green-400"
            : "text-red-400"
      }`}>
      {status === "saving"
        ? "Auto-saving..."
        : status === "saved"
          ? "Draft saved ✓"
          : "Save failed"}
    </span>
  );
}

// ======================== Main Page ========================
export default function FormFillPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params?.formId;

  const [form, setForm] = useState<FormStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseId, setResponseId] = useState<number | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [gpsCoords, setGpsCoords] = useState<GpsCoords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load form structure ──
  // Order: real API (A2-10) -> builder's locally-saved structure -> mock.
  // The middle step is what actually "links" this page to the builder:
  // build a form, hit Fill Form, and it renders exactly what you built,
  // even before the backend endpoint exists.
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/forms/${formId}/structure`);
        setForm(res.data);
      } catch {
        const local = formId ? readLocalFormStructure(formId) : null;
        setForm(local ?? getMockForm(formId ?? "1"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  // ── GPS capture: always attempted once the form has loaded ──
  // hasBoundary still controls whether the banner/GPS is *required* by
  // the form (used for validation elsewhere), but the location itself is
  // now always captured so it's attached to every submitted response.
  useEffect(() => {
    if (!form) return;
    if (!navigator.geolocation) {
      setGpsDenied(true);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
        setGpsDenied(false);
      },
      () => {
        setGpsLoading(false);
        setGpsDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [form]);

  // ── Create a draft response on first answer: POST /responses/forms/:formId (A4-01) ──
  const createDraftIfNeeded = useCallback(async () => {
    if (responseId) return responseId;
    try {
      const res = await apiClient.post(`/responses/forms/${formId}`, {
        status: "DRAFT",
        gps: gpsCoords,
      });
      const id = res.data.id;
      setResponseId(id);
      return id;
    } catch {
      return null;
    }
  }, [formId, responseId, gpsCoords]);

  // ── Auto-save every 30 seconds: PUT /responses/:id/answers/bulk (A4-08) ──
  const autoSave = useCallback(async () => {
    if (Object.keys(answers).length === 0) return;
    setAutoSaveStatus("saving");
    try {
      const id = await createDraftIfNeeded();
      if (!id) throw new Error("no response id");
      await apiClient.put(`/responses/${id}/answers/bulk`, { answers });
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    } catch {
      setAutoSaveStatus("error");
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }
  }, [answers, createDraftIfNeeded]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(autoSave, 30000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [autoSave]);

  // ── Conditional visibility ──
  const isQuestionVisible = (q: Question): boolean => {
    if (!q.conditional) return true;
    const depVal = answers[q.conditional.dependsOn];
    return String(depVal ?? "") === q.conditional.showWhen;
  };

  // ── Validate visible required questions in current section ──
  const getSectionErrors = (): string[] => {
    if (!form) return [];
    return form.sections[currentSectionIdx].questions
      .filter((q) => isQuestionVisible(q) && q.required)
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
    if (getSectionErrors().length > 0) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setCurrentSectionIdx((p) => p + 1);
    autoSave();
  };

  const handleBack = () => {
    setShowValidation(false);
    setCurrentSectionIdx((p) => p - 1);
  };

  // ── Go to review (FE-T404): saves the draft, then hands off to
  // /fill/review, which is where the actual POST /responses/:id/submit
  // (A4-12) happens after the "irreversible" confirmation. ──
  const handleGoToReview = async () => {
    if (getSectionErrors().length > 0) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    let id: number | null = null;
    try {
      id = await createDraftIfNeeded();
      if (id) {
        await apiClient.put(`/responses/${id}/answers/bulk`, { answers });
      }
    } catch {
      // fall through — review page will still work off the local handoff
    } finally {
      setIsSubmitting(false);
    }

    // Hand off so the review page (GET /responses/:id/full — A4-11) has
    // something to render even before that endpoint exists / while offline.
    if (typeof window !== "undefined" && form) {
      sessionStorage.setItem(
        reviewStorageKey(id ?? responseId ?? "draft"),
        JSON.stringify({
          responseId: id ?? responseId,
          form,
          answers,
          gpsCoords,
        }),
      );
    }

    router.push(
      `/studio/forms/${formId}/fill/review?responseId=${id ?? responseId ?? "draft"}`,
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form)
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Form not found.</p>
        <Link
          href="/userForms"
          className="text-blue-400 text-sm hover:underline mt-2 block">
          ← Back to forms
        </Link>
      </div>
    );

  const sections = form.sections;
  const currentSection = sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === sections.length - 1;
  const visibleQuestions = currentSection.questions.filter(isQuestionVisible);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Form Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{form.title}</h1>
            {form.description && (
              <p className="text-gray-400 text-sm mt-1">{form.description}</p>
            )}
          </div>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>

        {/* Progress Bar */}
        {form.showProgress && sections.length > 1 && (
          <div className="mt-4">
            <ProgressBar
              current={currentSectionIdx + 1}
              total={sections.length}
            />
          </div>
        )}
      </div>

      {/* GPS Banner — location is always captured for this form */}
      <GpsBanner coords={gpsCoords} loading={gpsLoading} denied={gpsDenied} />

      {/* Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white border-b border-[#30363d] pb-3">
          {currentSection.title}
        </h2>

        {/* Questions (only visible ones) */}
        {visibleQuestions.map((q) => (
          <AnswerField
            key={q.id}
            question={toAnswerQuestion(q)}
            value={answers[q.id] ?? null}
            onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            mode="fill"
            showValidation={showValidation}
          />
        ))}

        {visibleQuestions.length === 0 && (
          <p className="text-gray-500 text-sm italic text-center py-4">
            No questions to display in this section.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {currentSectionIdx > 0 ? (
          <button
            onClick={handleBack}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 border border-[#30363d] rounded-xl hover:bg-[#21262d] transition-colors">
            ← Back
          </button>
        ) : (
          <Link
            href="/userForms"
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
            ← Cancel
          </Link>
        )}

        {isLastSection ? (
          <button
            onClick={handleGoToReview}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            {isSubmitting ? "Saving..." : "Review Answers →"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            Next →
          </button>
        )}
      </div>

      {/* Section dots indicator */}
      {sections.length > 1 && (
        <div className="flex justify-center gap-2">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentSectionIdx
                  ? "bg-blue-500"
                  : idx < currentSectionIdx
                    ? "bg-green-500"
                    : "bg-[#30363d]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
