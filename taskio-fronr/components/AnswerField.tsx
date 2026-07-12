"use client";

import React, { useState } from "react";
import FileUploadField, {
  FileAnswerMetadata,
} from "@/components/FileUploadField";

// ======================== Types ========================
export type QuestionType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE"
  | "BOOLEAN"
  | "GEOPOINT"
  | "FILE"; // NEW — file picker / drag-drop upload (FE-T403, A5-01)

export interface GeoPointValue {
  lat: number;
  lng: number;
}

// The shape of an answer differs depending on the question type.
// This matches what the API is expected to receive.
export type AnswerValue =
  | string // TEXT, DATE, SINGLE_CHOICE
  | number // NUMBER
  | string[] // MULTI_CHOICE
  | boolean // BOOLEAN
  | GeoPointValue // GEOPOINT
  | FileAnswerMetadata // FILE — { mediaId, fileName, fileType, fileSize }
  | null;

export interface AnswerQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // used by SINGLE_CHOICE / MULTI_CHOICE
  // NEW — FILE questions only. Falls back to FileUploadField's own
  // defaults (10MB, image/*+PDF) when omitted.
  maxSizeBytes?: number;
  accept?: string;
}

interface AnswerFieldProps {
  question: AnswerQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** "preview" = read-only-ish demo inside the builder, "fill" = real form-filling by an end user */
  mode?: "preview" | "fill";
  /** Whether to show the "This field is required" error if empty */
  showValidation?: boolean;
}

// ======================== Helpers ========================
function isEmptyValue(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && "lat" in (value as object)) {
    const g = value as GeoPointValue;
    return g.lat === undefined || g.lng === undefined;
  }
  if (typeof value === "object" && "mediaId" in (value as object)) {
    const f = value as FileAnswerMetadata;
    return !f.mediaId;
  }
  return false;
}

// ======================== Main Component ========================
export default function AnswerField({
  question,
  value,
  onChange,
  mode = "fill",
  showValidation = false,
}: AnswerFieldProps) {
  const isInvalid = showValidation && question.required && isEmptyValue(value);

  // FILE questions render their own label + required marker inside
  // FileUploadField (it needs the label next to the dropzone, not above
  // an input), so skip the shared label here to avoid a duplicate.
  if (question.type === "FILE") {
    return (
      <div className="space-y-1.5">
        <FileUploadField
          questionId={question.id}
          label={question.label}
          required={question.required}
          value={(value as FileAnswerMetadata) ?? null}
          onChange={(metadata) => onChange(metadata)}
          showValidation={showValidation}
          maxSizeBytes={question.maxSizeBytes}
          accept={question.accept}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white">
        {question.label}
        {question.required && <span className="text-error ml-1">*</span>}
      </label>

      <RendererSwitch
        question={question}
        value={value}
        onChange={onChange}
        mode={mode}
        isInvalid={isInvalid}
      />

      {isInvalid && (
        <p className="text-xs text-error mt-1">This field is required.</p>
      )}
    </div>
  );
}

// ======================== Renderer Switch ========================
function RendererSwitch({
  question,
  value,
  onChange,
  mode,
  isInvalid,
}: {
  question: AnswerQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  mode: "preview" | "fill";
  isInvalid: boolean;
}) {
  const baseInputClasses = `w-full bg-background border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    isInvalid ? "border-red-500" : "border-border"
  }`;

  switch (question.type) {
    // ── TEXT ──
    case "TEXT":
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          placeholder={question.placeholder || "Enter your answer"}
          onChange={(e) => onChange(e.target.value)}
          disabled={mode === "preview"}
          className={baseInputClasses}
        />
      );

    // ── NUMBER ──
    case "NUMBER":
      return (
        <input
          type="number"
          value={value === null || value === undefined ? "" : (value as number)}
          placeholder={question.placeholder || "Enter a number"}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          disabled={mode === "preview"}
          className={baseInputClasses}
        />
      );

    // ── DATE ──
    case "DATE":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={mode === "preview"}
          className={`${baseInputClasses} [color-scheme:dark]`}
        />
      );

    // ── SINGLE_CHOICE ──
    case "SINGLE_CHOICE":
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={mode === "preview"}
                className="accent-blue-600 w-4 h-4"
              />
              {opt}
            </label>
          ))}
          {(!question.options || question.options.length === 0) && (
            <p className="text-xs text-muted-foreground italic">
              No options defined yet.
            </p>
          )}
        </div>
      );

    // ── MULTI_CHOICE ──
    case "MULTI_CHOICE": {
      const selected = (value as string[]) ?? [];
      const toggle = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter((o) => o !== opt));
        } else {
          onChange([...selected, opt]);
        }
      };
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                disabled={mode === "preview"}
                className="accent-blue-600 w-4 h-4"
              />
              {opt}
            </label>
          ))}
          {(!question.options || question.options.length === 0) && (
            <p className="text-xs text-muted-foreground italic">
              No options defined yet.
            </p>
          )}
        </div>
      );
    }

    // ── BOOLEAN ──
    case "BOOLEAN":
      return (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={mode === "preview"}
            onClick={() => onChange(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              value === true
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border-blue-600 text-white"
                : "bg-background border-border text-muted-foreground hover:border-blue-500/50"
            }`}>
            Yes
          </button>
          <button
            type="button"
            disabled={mode === "preview"}
            onClick={() => onChange(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              value === false
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border-blue-600 text-white"
                : "bg-background border-border text-muted-foreground hover:border-blue-500/50"
            }`}>
            No
          </button>
        </div>
      );

    // ── GEOPOINT (map pin) ──
    case "GEOPOINT":
      return (
        <GeoPointPicker
          value={value as GeoPointValue | null}
          onChange={(g) => onChange(g)}
          disabled={mode === "preview"}
          isInvalid={isInvalid}
        />
      );

    // NOTE: "FILE" is intercepted earlier in <AnswerField> (before this
    // switch even runs), since FileUploadField renders its own label.
    // It's listed here only so TypeScript's exhaustiveness is happy and
    // to document that it's handled, not falling into `default`.
    case "FILE":
      return null;

    default:
      return (
        <p className="text-xs text-muted-foreground italic">
          Unsupported question type: {question.type}
        </p>
      );
  }
}

// ======================== GeoPoint Picker (simple map-pin UI) ========================
function GeoPointPicker({
  value,
  onChange,
  disabled,
  isInvalid,
}: {
  value: GeoPointValue | null;
  onChange: (value: GeoPointValue) => void;
  disabled?: boolean;
  isInvalid?: boolean;
}) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Map a click position inside the box to a fake lat/lng range.
  // In a real app this would be a real map (Google Maps / Leaflet / Mapbox).
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    // Fake conversion: x -> lng (-180 to 180), y -> lat (90 to -90)
    const lng = xPct * 360 - 180;
    const lat = 90 - yPct * 180;

    onChange({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
  };

  // Convert lat/lng back into a position inside the box, for rendering the pin
  const pinPos =
    value !== null
      ? {
          x: ((value.lng + 180) / 360) * 100,
          y: ((90 - value.lat) / 180) * 100,
        }
      : null;

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        onMouseLeave={() => setHoverPos(null)}
        className={`relative w-full h-48 rounded-lg border overflow-hidden select-none ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair"
        } ${isInvalid ? "border-red-500" : "border-border"}`}
        style={{
          backgroundImage:
            "linear-gradient(0deg, #161b22 1px, transparent 1px), linear-gradient(90deg, #161b22 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#0d1117",
        }}>
        {/* Faux "land mass" shapes so it looks a bit map-like */}
        <div className="absolute top-6 left-10 w-20 h-12 bg-muted rounded-full opacity-60" />
        <div className="absolute bottom-8 right-12 w-24 h-16 bg-muted rounded-full opacity-60" />
        <div className="absolute top-1/2 left-1/3 w-16 h-10 bg-muted rounded-full opacity-40" />

        {/* Hover crosshair hint */}
        {hoverPos && !disabled && (
          <div
            className="absolute w-3 h-3 rounded-full border border-blue-400/60 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: hoverPos.x, top: hoverPos.y }}
          />
        )}

        {/* Selected pin */}
        {pinPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}>
            <span className="text-2xl">📍</span>
          </div>
        )}

        {!value && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs pointer-events-none">
            Click to drop a pin
          </div>
        )}
      </div>

      {value && (
        <p className="text-xs text-muted-foreground">
          Lat: {value.lat}, Lng: {value.lng}
        </p>
      )}
    </div>
  );
}
