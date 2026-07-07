"use client";

import React, { useCallback, useRef, useState } from "react";

// ============================================================
// TYPES
// ============================================================
export interface FileAnswerMetadata {
  mediaId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface FileUploadFieldProps {
  questionId: string;
  label: string;
  required?: boolean;
  /** Existing value, if the user already uploaded something for this question */
  value?: FileAnswerMetadata | null;
  /** Called with the metadata to store in answer.metadata, or null if cleared */
  onChange: (metadata: FileAnswerMetadata | null) => void;
  showValidation?: boolean;
  /** Defaults to 10MB per acceptance criteria */
  maxSizeBytes?: number;
  /** Defaults to image/* and application/pdf per acceptance criteria */
  accept?: string;
  /** Upload endpoint (A5-01) */
  uploadUrl?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT = "image/*,application/pdf";
const DEFAULT_UPLOAD_URL = "/files/upload";

type UploadStatus = "idle" | "uploading" | "success" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAccepted(file: File, accept: string): boolean {
  const patterns = accept.split(",").map((p) => p.trim());
  return patterns.some((pattern) => {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // e.g. "image/"
      return file.type.startsWith(prefix);
    }
    return file.type === pattern;
  });
}

// ============================================================
// COMPONENT
// ============================================================
export default function FileUploadField({
  questionId,
  label,
  required,
  value,
  onChange,
  showValidation,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  uploadUrl = DEFAULT_UPLOAD_URL,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(
    value ? "success" : "idle",
  );
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const isMissingRequired = showValidation && required && status !== "success";

  // ===== VALIDATE + KICK OFF UPLOAD =====
  const startUpload = useCallback(
    (file: File) => {
      setErrorMsg(null);

      if (!isAccepted(file, accept)) {
        setStatus("error");
        setErrorMsg("Only images and PDF files are allowed.");
        return;
      }
      if (file.size > maxSizeBytes) {
        setStatus("error");
        setErrorMsg(
          `File is too large (${formatBytes(file.size)}). Max size is ${formatBytes(
            maxSizeBytes,
          )}.`,
        );
        return;
      }

      // thumbnail preview (images only — PDFs get a generic icon)
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      setPendingFile(file);
      setStatus("uploading");
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionId", questionId);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const mediaId: string = data.mediaId ?? data.id;
            if (!mediaId) throw new Error("No mediaId in response");
            setStatus("success");
            setProgress(100);
            onChange({
              mediaId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            });
          } catch {
            setStatus("error");
            setErrorMsg("Upload succeeded but response was invalid.");
          }
        } else {
          setStatus("error");
          setErrorMsg(`Upload failed (${xhr.status}). Please retry.`);
        }
      });

      xhr.addEventListener("error", () => {
        setStatus("error");
        setErrorMsg("Network error during upload. Please retry.");
      });

      xhr.addEventListener("abort", () => {
        setStatus("idle");
        setProgress(0);
      });

      xhr.open("POST", uploadUrl);
      xhr.send(formData);
    },
    [accept, maxSizeBytes, onChange, questionId, uploadUrl],
  );

  const handleRetry = useCallback(() => {
    if (pendingFile) startUpload(pendingFile);
  }, [pendingFile, startUpload]);

  const handleRemove = useCallback(() => {
    xhrRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, previewUrl]);

  const handleFileSelected = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) startUpload(file);
    },
    [startUpload],
  );

  // ===== DRAG & DROP HANDLERS =====
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingOver(false);
      handleFileSelected(e.dataTransfer.files);
    },
    [handleFileSelected],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-200">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>

      {/* Idle / drag-drop zone (shown when no file is attached or upload errored) */}
      {(status === "idle" || status === "error") && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
            isDraggingOver
              ? "border-blue-500 bg-blue-500/10"
              : isMissingRequired || status === "error"
                ? "border-red-500/50 bg-red-500/5"
                : "border-[#30363d] bg-[#0d1117] hover:border-blue-500/50 hover:bg-[#1f242c]"
          }`}>
          <span className="text-2xl">📎</span>
          <p className="text-sm text-gray-300">
            <span className="text-blue-400 font-medium">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            Images or PDF, up to {formatBytes(maxSizeBytes)}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files)}
          />
        </div>
      )}

      {/* Error message + retry */}
      {status === "error" && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-red-400">⚠️ {errorMsg}</span>
          {pendingFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Uploading / uploaded card with thumbnail */}
      {(status === "uploading" || status === "success") && pendingFile && (
        <div className="flex items-center gap-3 rounded-xl border border-[#30363d] bg-[#0d1117] p-3">
          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#161b22] border border-[#30363d] flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`Preview of ${pendingFile.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">📄</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{pendingFile.name}</p>
            <p className="text-xs text-gray-500">
              {formatBytes(pendingFile.size)}
            </p>

            {status === "uploading" && (
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#30363d] overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {status === "success" && (
              <p className="mt-1 text-xs text-green-400">Uploaded ✓</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            title={status === "uploading" ? "Cancel upload" : "Remove file"}
            className="shrink-0 text-gray-500 hover:text-red-400 text-sm transition-colors">
            ✕
          </button>
        </div>
      )}

      {isMissingRequired && (
        <p className="text-xs text-red-400">This field is required.</p>
      )}
    </div>
  );
}
