"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ======================== Types ========================
interface SnapshotQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface SnapshotSection {
  id: string;
  title: string;
  questions: SnapshotQuestion[];
}

interface Snapshot {
  versionNumber: number;
  label: string;
  createdAt: string;
  createdBy: string;
  sections: SnapshotSection[];
}

// ======================== Mock Snapshot ========================
const MOCK_SNAPSHOT: Snapshot = {
  versionNumber: 2,
  label: "Updated personal info questions",
  createdAt: "2026-07-01T14:30:00Z",
  createdBy: "ahmed@taskio.com",
  sections: [
    {
      id: "s1",
      title: "Personal Information",
      questions: [
        { id: "q1", label: "Full Name", type: "text", required: true },
        { id: "q2", label: "Email Address", type: "email", required: true },
        { id: "q3", label: "Phone Number", type: "text", required: false },
      ],
    },
    {
      id: "s2",
      title: "Feedback",
      questions: [
        {
          id: "q4",
          label: "How did you hear about us?",
          type: "radio",
          required: false,
          options: ["Social Media", "Friend", "Google", "Other"],
        },
        {
          id: "q5",
          label: "Additional Comments",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ======================== Read-Only Question Renderer ========================
function ReadOnlyQuestion({ question }: { question: SnapshotQuestion }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {question.label}
          {question.required && <span className="text-error ml-1">*</span>}
        </p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
          {question.type}
        </span>
      </div>

      {/* Render a disabled preview of each field type */}
      {["text", "email", "number"].includes(question.type) && (
        <input
          disabled
          placeholder={`Enter ${question.label.toLowerCase()}...`}
          className="w-full bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
        />
      )}

      {question.type === "textarea" && (
        <textarea
          disabled
          rows={3}
          placeholder="Enter your answer..."
          className="w-full bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed resize-none"
        />
      )}

      {question.type === "date" && (
        <input
          type="date"
          disabled
          className="w-full bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed [color-scheme:dark]"
        />
      )}

      {question.type === "radio" && (
        <div className="space-y-1.5">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-muted-foreground cursor-not-allowed">
              <input type="radio" disabled className="accent-blue-600" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {question.type === "checkbox" && (
        <div className="space-y-1.5">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-muted-foreground cursor-not-allowed">
              <input type="checkbox" disabled className="accent-blue-600" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================== Main Snapshot View Page ========================
export default function SnapshotViewPage({
  params,
}: {
  params: { formId: string; versionNumber: string };
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  // ── Load snapshot: GET /forms/:id/versions/:versionNumber (A2-38) ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/forms/${params.formId}/versions/${params.versionNumber}`,
        );
        if (res.ok) {
          setSnapshot(await res.json());
        } else {
          setSnapshot(MOCK_SNAPSHOT);
        }
      } catch {
        setSnapshot(MOCK_SNAPSHOT);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.formId, params.versionNumber]);

  // ── Copy snapshot as new editable form ──
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const res = await fetch(
        `/api/forms/${params.formId}/versions/${params.versionNumber}/copy`,
        { method: "POST" },
      );
      if (res.ok) {
        const newForm = await res.json();
        router.push(`/studio/forms/${newForm.id}/builder`);
      } else {
        router.push(`/studio/forms/new-copy/builder`);
      }
    } catch {
      router.push(`/studio/forms/new-copy/builder`);
    } finally {
      setIsCopying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading snapshot...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-error text-sm">Snapshot not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() =>
                  router.push(`/studio/forms/${params.formId}/versions`)
                }
                className="text-muted-foreground hover:text-muted-foreground text-sm transition-colors">
                ← Versions
              </button>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              v{snapshot.versionNumber} — {snapshot.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(snapshot.createdAt)} · by {snapshot.createdBy}
            </p>
          </div>

          <button
            onClick={handleCopy}
            disabled={isCopying}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-medium rounded-lg transition-colors shrink-0">
            {isCopying ? "Creating..." : "📋 Copy as New Form"}
          </button>
        </div>

        {/* ── Read-only banner ── */}
        <div className="bg-warning/15 border border-warning/20 text-warning text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>🔒</span>
          <span>
            This is a <strong>read-only snapshot</strong>. You cannot edit it.
            Use Copy as New Form to create an editable copy.
          </span>
        </div>

        {/* ── Sections & Questions ── */}
        <div className="space-y-6">
          {snapshot.sections.map((sec) => (
            <div
              key={sec.id}
              className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-foreground border-b border-border pb-2">
                {sec.title}
              </h2>
              <div className="space-y-5">
                {sec.questions.map((q) => (
                  <ReadOnlyQuestion key={q.id} question={q} />
                ))}
                {sec.questions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No questions in this section.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
