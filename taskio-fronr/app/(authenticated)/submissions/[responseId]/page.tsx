"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, Loader2, MapPin } from "lucide-react";
import apiClient from "@/lib/api/client";
import { useTranslation } from "react-i18next";

interface Answer {
  questionId: string;
  label: string;
  required: boolean;
  value: any;
}

interface ResponseSection {
  id: string;
  title: string;
  answers: Answer[];
}

interface FullResponseDetail {
  id: number;
  formId: number;
  formTitle: string;
  sections: ResponseSection[];
}

export default function SubmissionViewPage() {
  const params = useParams<{ responseId: string }>();
  const router = useRouter();
  
  const [detailData, setDetailData] = useState<FullResponseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!params?.responseId) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<FullResponseDetail>(`/responses/${params.responseId}/full`);
        setDetailData(res.data);
      } catch (err: any) {
        console.error("Failed to load details:", err);
        if (err.response?.status === 403 || err.response?.status === 404) {
          setError(t("submissionDetail.notFoundOrNoPermission"));
        } else {
          setError(t("submissionDetail.failedToLoad"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params?.responseId]);

  const renderAnswerValue = (val: any) => {
    if (val === null || val === undefined || val === "") return <span className="text-muted-foreground italic">{t("submissionDetail.noAnswer")}</span>;
    if (typeof val === "boolean") return val ? t("submissionDetail.yes") : t("submissionDetail.no");
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : <span className="text-muted-foreground italic">{t("submissionDetail.noAnswer")}</span>;
    if (typeof val === "object") {
      if (val.lat !== undefined && val.lng !== undefined) {
        return (
          <span className="inline-flex items-center gap-1 text-primary bg-blue-500/5 px-2.5 py-0.5 rounded border border-blue-500/10 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {val.lat.toFixed(4)}, {val.lng.toFixed(4)}
          </span>
        );
      }
      if (val.mediaId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
        const fileUrl = `${baseUrl}/files/${val.mediaId}`;
        return (
          <div className="flex items-center gap-4 border border-border p-3 rounded-xl bg-muted/20 w-max max-w-full overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-medium truncate">{val.fileName || t("submissionDetail.uploadedFile")}</span>
              {val.fileSize && <span className="text-xs text-muted-foreground whitespace-nowrap">({Math.round(val.fileSize / 1024)} KB)</span>}
            </div>
            <div className="flex items-center gap-2 ms-auto shrink-0">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition">
                {t("submissionDetail.view")}
              </a>
              <a href={fileUrl} download={val.fileName || "download"} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition">
                {t("submissionDetail.download")}
              </a>
            </div>
          </div>
        );
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground">{t("submissionDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("submissionDetail.back")}
        </button>
        <div className="bg-error/15 border border-error/20 text-error p-6 rounded-2xl text-center text-sm font-semibold">
          {error || t("submissionDetail.notFound")}
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6 max-w-4xl mx-auto py-4 text-foreground pb-12">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <Link href="/submissions" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("submissionDetail.backToSubmissions")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" />
            {detailData.formTitle}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-xs font-semibold uppercase tracking-wide">
              {t("submissionDetail.readOnlyView")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("submissionDetail.lockedAnswers")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {detailData.sections.map((sec) => (
          <div key={sec.id} className="space-y-4">
            <h4 className="font-bold text-md text-foreground border-s-4 border-blue-500 ps-3 uppercase tracking-wider text-xs">
              {sec.title}
            </h4>
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60 shadow-sm">
              {sec.answers.map((ans) => (
                <div key={ans.questionId} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <span className="font-semibold text-sm text-muted-foreground md:col-span-1">
                    {ans.label}
                  </span>
                  <div className="text-sm text-foreground md:col-span-2">
                    {renderAnswerValue(ans.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {detailData.sections.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            {t("submissionDetail.noSections")}
          </div>
        )}
      </div>
    </main>
  );
}
