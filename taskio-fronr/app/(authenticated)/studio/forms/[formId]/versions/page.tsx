"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ======================== Types ========================
interface FormVersion {
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  label: string;
  questionCount: number;
  sectionCount: number;
}

// ======================== Mock Data (fallback when API isn't ready) ========================
const MOCK_VERSIONS: FormVersion[] = [
  {
    versionNumber: 3,
    createdAt: "2026-07-03T10:00:00Z",
    createdBy: "ahmed@taskio.com",
    label: "Added feedback section",
    questionCount: 8,
    sectionCount: 3,
  },
  {
    versionNumber: 2,
    createdAt: "2026-07-01T14:30:00Z",
    createdBy: "ahmed@taskio.com",
    label: "Updated personal info questions",
    questionCount: 5,
    sectionCount: 2,
  },
  {
    versionNumber: 1,
    createdAt: "2026-06-28T09:00:00Z",
    createdBy: "ahmed@taskio.com",
    label: "Initial snapshot",
    questionCount: 3,
    sectionCount: 1,
  },
];

// ======================== Helpers ========================
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ======================== Version Card ========================
function VersionCard({
  version,
  formId,
  onCopy,
  isLatest,
}: {
  version: FormVersion;
  formId: string;
  onCopy: (versionNumber: number) => void;
  isLatest: boolean;
}) {
  const router = useRouter();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-blue-500/30 transition-all flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Version badge */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm/10 border border-blue-600/20 shrink-0">
            <span className="text-xs text-primary font-semibold leading-none">
              v
            </span>
            <span className="text-lg text-primary font-bold leading-none">
              {version.versionNumber}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {version.label}
              </p>
              {isLatest && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success text-success-foreground border-transparent shadow-sm">
                  LATEST
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(version.createdAt)} · by {version.createdBy}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {version.sectionCount}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Sections
            </p>
          </div>
          <div className="w-px bg-accent" />
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {version.questionCount}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Questions
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-border/60">
        {/* View read-only snapshot */}
        <button
          onClick={() =>
            router.push(
              `/studio/forms/${formId}/versions/${version.versionNumber}`,
            )
          }
          className="flex-1 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-blue-500/50 hover:text-primary/80 transition-all">
          👁 View Snapshot
        </button>

        {/* Create a copy → generates new editable form */}
        <button
          onClick={() => onCopy(version.versionNumber)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-purple-500/50 hover:text-primary/80 transition-all">
          📋 Copy as New Form
        </button>
      </div>
    </div>
  );
}

// ======================== Main Versions Page ========================
export default function FormVersionsPage({
  params,
}: {
  params: { formId: string };
}) {
  const router = useRouter();
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCopying, setIsCopying] = useState<number | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Toast helper ──
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load versions: GET /forms/:id/versions (A2-37) ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/forms/${params.formId}/versions`);
        if (res.ok) {
          const data = await res.json();
          setVersions(data);
        } else {
          setVersions(MOCK_VERSIONS);
        }
      } catch {
        setVersions(MOCK_VERSIONS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.formId]);

  // ── Create snapshot: POST /forms/:id/versions (A2-36) ──
  const handleCreateSnapshot = async () => {
    if (!snapshotLabel.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/forms/${params.formId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: snapshotLabel }),
      });

      if (res.ok) {
        const newVersion = await res.json();
        setVersions((prev) => [newVersion, ...prev]);
      } else {
        // Mock: add locally if API isn't ready
        const mockNew: FormVersion = {
          versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
          createdAt: new Date().toISOString(),
          createdBy: "ahmed@taskio.com",
          label: snapshotLabel,
          questionCount: 0,
          sectionCount: 0,
        };
        setVersions((prev) => [mockNew, ...prev]);
      }

      showToast("Snapshot created successfully ✓");
      setSnapshotLabel("");
      setShowLabelInput(false);
    } catch {
      showToast("Failed to create snapshot", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Copy version as new editable form ──
  const handleCopy = async (versionNumber: number) => {
    setIsCopying(versionNumber);
    try {
      const res = await fetch(
        `/api/forms/${params.formId}/versions/${versionNumber}/copy`,
        { method: "POST" },
      );

      if (res.ok) {
        const newForm = await res.json();
        showToast("New form created from snapshot ✓");
        router.push(`/studio/forms/${newForm.id}/builder`);
      } else {
        // Mock navigation
        showToast("New form created — redirecting to builder ✓");
        setTimeout(() => router.push(`/studio/forms/new-copy/builder`), 1200);
      }
    } catch {
      showToast("Failed to copy version", "error");
    } finally {
      setIsCopying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Version History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Form ID: {params.formId} · {versions.length} snapshot
              {versions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Create snapshot button */}
          {!showLabelInput ? (
            <button
              onClick={() => setShowLabelInput(true)}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-medium rounded-lg transition-colors">
              + Create Snapshot
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSnapshot();
                  if (e.key === "Escape") setShowLabelInput(false);
                }}
                placeholder="Snapshot label..."
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
              <button
                onClick={handleCreateSnapshot}
                disabled={isCreating || !snapshotLabel.trim()}
                className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 text-sm font-medium rounded-lg transition-colors">
                {isCreating ? "..." : "Save"}
              </button>
              <button
                onClick={() => setShowLabelInput(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none">
                ×
              </button>
            </div>
          )}
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div
            className={`px-4 py-2.5 rounded-lg text-sm border ${
              toast.type === "success"
                ? "bg-success/15 border-success/20 text-success"
                : "bg-error/15 border-error/20 text-error"
            }`}>
            {toast.message}
          </div>
        )}

        {/* ── Versions List ── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl h-28 animate-pulse"
              />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              No snapshots yet
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Create your first snapshot to start tracking versions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((v, idx) => (
              <div key={v.versionNumber} className="relative">
                {isCopying === v.versionNumber && (
                  <div className="absolute inset-0 bg-background/60 rounded-2xl flex items-center justify-center z-10">
                    <p className="text-sm text-primary">Creating copy...</p>
                  </div>
                )}
                <VersionCard
                  version={v}
                  formId={params.formId}
                  onCopy={handleCopy}
                  isLatest={idx === 0}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
