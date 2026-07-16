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
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "react-i18next";


// ======================== Helpers ========================
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const { t } = useTranslation();
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {t("fillForm.sectionProgress", { current, total })}
        </span>
        <span className="font-medium text-primary">{pct}%</span>
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
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-warning/15 border border-warning/20 text-warning text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
        <span className="animate-spin">⟳</span>
        {t("fillForm.capturingLocation")}
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
      <div className="bg-success/15 border border-success/20 rounded-lg overflow-hidden">
        <div className="text-success text-xs px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span>📍</span>
            {t("fillForm.locationCaptured", { accuracy: Math.round(accuracy) })}
          </span>
          {/* Same-tab navigation by design (no target="_blank"). Note: this
              will leave the fill flow, so anything not auto-saved yet will
              be lost — surface this to users if it becomes an issue. */}
          <a
            href={mapLink}
            className="underline hover:text-green-300 whitespace-nowrap">
            {t("fillForm.openInMaps")}
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
      <div className="bg-error/15 border border-error/20 text-error text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
        <span>⚠️</span>
        {t("fillForm.locationDenied")}
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
  const { t } = useTranslation();
  if (status === "idle") return null;
  return (
    <span
      className={`text-[10px] font-medium ${
        status === "saving"
          ? "text-muted-foreground animate-pulse"
          : status === "saved"
            ? "text-success"
            : "text-error"
      }`}>
      {status === "saving"
        ? t("fillForm.autoSaving")
        : status === "saved"
          ? t("fillForm.draftSaved")
          : t("fillForm.saveFailed")}
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
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [locationWarningMsg, setLocationWarningMsg] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationDistance, setLocationDistance] = useState<number | null>(null);
  const [locationRequiredDistance, setLocationRequiredDistance] = useState<number | null>(null);

  const { currentUser } = useAuthStore();
  const role = currentUser?.role;
  const { t } = useTranslation();

  const backLink = React.useMemo(() => {
    if (role === "SUPER_ADMIN") return "/super-admin/dashboard";
    if (role === "ADMIN") return "/studio/forms";
    return "/userForms";
  }, [role]);

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


  // ── Client-Side Location Validation ──
  useEffect(() => {
    if (!form || !gpsCoords) return;
    // FormStructure extends FormSettings, so settings fields are directly on `form`
    if (!form.restrictByLocation || !form.location || !form.allowedRadius) return;

    // Accuracy Check
    if (gpsCoords.accuracy > form.allowedRadius * 2 && gpsCoords.accuracy > 150) {
      setLocationBlocked(true);
      setLocationErrorMsg(t("fillForm.locationAccuracyTooLow", { accuracy: Math.round(gpsCoords.accuracy) }));
      return;
    }

    const dist = haversineDistance(gpsCoords.lat, gpsCoords.lng, form.location.lat, form.location.lng);
    setLocationDistance(dist);
    setLocationRequiredDistance(form.allowedRadius);
    if (form.location.address) {
      setLocationName(form.location.address);
    }

    let maxDist = form.allowedRadius;
    if (form.validationMode === "ALLOW_NEARBY" && form.graceRadius) {
      maxDist = form.graceRadius;
      if (dist > form.allowedRadius && dist <= form.graceRadius) {
        setLocationWarningMsg(t("fillForm.locationWarningNearby"));
      } else {
        setLocationWarningMsg("");
      }
    }

    if (dist > maxDist) {
      setLocationBlocked(true);
    } else {
      setLocationBlocked(false);
    }
  }, [form, gpsCoords, t]);

  // ── Create a draft response on first answer: POST /responses/forms/:formId (A4-01) ──
  const createDraftIfNeeded = useCallback(async () => {
    if (responseId) return responseId;
    try {
      console.log("[Fill Form] Draft creation started for form", formId);
      console.log("[Fill Form] Browser coords:", gpsCoords?.lat, gpsCoords?.lng);
      console.log("[Fill Form] API payload:", { status: "DRAFT", gps: gpsCoords });
      
      const res = await apiClient.post(`/responses/forms/${formId}`, {
        status: "DRAFT",
        gps: gpsCoords,
      });
      
      console.log("[Fill Form] API response:", res.data);
      console.log("[Fill Form] Validation result (inside?):", true); // since it didn't throw 403
      
      const id = res.data.id;
      setResponseId(id);
      return id;
    } catch (err: any) {
      console.log("[Fill Form] API error:", err?.response?.status, err?.response?.data);
      if (err?.response?.status === 403) {
        console.log("[Fill Form] Validation result (inside?): false (403 Forbidden)");
        setLocationBlocked(true);
        setLocationErrorMsg(
          err?.response?.data?.message || "You must be inside the configured location to submit this form."
        );
      }
      return null;
    }
  }, [formId, responseId, gpsCoords]);

  // ── Eagerly create draft to validate location if restricted ──
  useEffect(() => {
    if (!form || !form.restrictByLocation || locationBlocked || responseId) return;
    
    // We only want to trigger this eagerly once we have either a GPS success or failure
    if (gpsCoords || gpsDenied) {
      createDraftIfNeeded();
    }
  }, [form, gpsCoords, gpsDenied, locationBlocked, responseId, createDraftIfNeeded]);

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
  const handleSubmit = async () => {
    if (getSectionErrors().length > 0) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    let id: number | null = null;
    try {
      id = await createDraftIfNeeded();
      if (!id) {
        throw new Error("Could not create draft");
      }
      await apiClient.put(`/responses/${id}/answers/bulk`, { answers });
      await apiClient.post(`/responses/${id}/submit`, { gps: gpsCoords });
      
      // Clean up session storage if we had any
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(reviewStorageKey(id ?? responseId ?? "draft"));
      }

      router.push(`/studio/forms/${formId}/fill/thank-you`);
    } catch (err) {
      console.error("Submission failed:", err);
      alert(t("fillForm.submissionFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t("fillForm.loading")}</p>
        </div>
      </div>
    );
  }

  if (!form)
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("fillForm.formNotFound")}</p>
        <Link
          href={backLink}
          className="text-primary text-sm hover:underline mt-2 block">
          {t("fillForm.backToForms")}
        </Link>
      </div>
    );

  if (locationBlocked) {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-10 mt-20">
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100/50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{t("fillForm.locationRestricted")}</h1>
          <p className="text-sm text-muted-foreground">{locationErrorMsg}</p>
          <Link
            href={backLink}
            className="mt-6 px-4 py-2 inline-block bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-bold rounded-xl transition-colors">
            {t("fillForm.backToFormsBtn")}
          </Link>
        </div>
      </div>
    );
  }

  const sections = form.sections || [];

  if (sections.length === 0 || !sections[currentSectionIdx]) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10 mt-10">
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">{form.title}</h1>
          <p className="text-sm text-muted-foreground">{t("fillForm.noQuestions")}</p>
          <Link
            href={backLink}
            className="mt-4 px-4 py-2 inline-block bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-bold rounded-xl transition-colors">
            {t("fillForm.backToFormsBtn")}
          </Link>
        </div>
      </div>
    );
  }

  const currentSection = sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === sections.length - 1;
  const visibleQuestions = currentSection.questions.filter(isQuestionVisible);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Form Header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground text-sm mt-1">{form.description}</p>
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
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
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
          <p className="text-muted-foreground text-sm italic text-center py-4">
            {t("fillForm.noQuestionsSection")}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {currentSectionIdx > 0 ? (
          <button
            onClick={handleBack}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
            {t("fillForm.back")}
          </button>
        ) : (
          <Link
            href={backLink}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("fillForm.cancel")}
          </Link>
        )}

        {isLastSection ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-foreground text-sm font-bold rounded-xl transition-colors shadow-sm">
            {isSubmitting ? t("fillForm.submitting") : t("fillForm.submit")}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-bold rounded-xl transition-colors shadow-sm">
            {t("fillForm.next")}
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
                    : "bg-accent"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
