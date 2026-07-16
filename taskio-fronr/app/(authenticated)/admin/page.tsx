"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import { hasQuestions } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatters";

interface Form {
  id: number;
  title: string;
  status: "published" | "draft" | "archived" | "Published" | "Draft";
  submissions?: number;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(() => {
    apiClient
      .get("/forms")
      .then((response) => {
        const items = response.data.items || [];
        setForms(items.filter(hasQuestions));
      })
      .catch((error) => {
        console.warn(
          "Forms API failed or returned 404, using fallback mock data:",
          error,
        );
        setForms([
          {
            id: 1,
            title: "Employee Feedback Survey",
            status: "Published",
            submissions: 132,
          },
          {
            id: 2,
            title: "Training Evaluation Form",
            status: "Draft",
            submissions: 0,
          },
          {
            id: 3,
            title: "Customer Satisfaction Survey",
            status: "published",
            submissions: 86,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchForms();
    const interval = setInterval(fetchForms, 10000);
    return () => clearInterval(interval);
  }, [fetchForms]);

  return (
    <main className="space-y-8 text-foreground">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {t("dashboard.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Link
          href="/studio/forms/new"
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(229,57,53,0.39)] hover:shadow-[0_6px_20px_rgba(229,57,53,0.23)] text-sm font-semibold rounded-full transition-all duration-200 border border-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-2">
          {t("dashboard.createFormBtn")}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-md border border-border/60 flex flex-col gap-1 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">{t("dashboard.totalForms")}</p>
            <div className="bg-muted p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
          </div>
          <h3 className="text-4xl font-black mt-2 text-foreground tracking-tighter">{formatNumber(forms.length, i18n.language)}</h3>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-md border border-border/60 flex flex-col gap-1 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">{t("dashboard.publishedForms")}</p>
            <div className="bg-success/10 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <h3 className="text-4xl font-black mt-2 text-success tracking-tighter">
            {formatNumber(forms.filter((f) => f.status?.toLowerCase() === "published").length, i18n.language)}
          </h3>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-md border border-border/60 flex flex-col gap-1 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">{t("dashboard.totalSubmissions")}</p>
            <div className="bg-primary/10 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
          </div>
          <h3 className="text-4xl font-black mt-2 text-primary tracking-tighter">
            {formatNumber(forms.reduce((acc, form) => acc + (form.submissions || 0), 0), i18n.language)}
          </h3>
        </div>
      </div>

      {/* Recent Forms Section */}
      <div className="bg-card rounded-xl p-8 shadow-sm border border-border/60">
        <h3 className="text-xl font-bold mb-6 text-foreground border-b border-border/60 pb-4">
          {t("dashboard.recentForms")}
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {forms.slice(0, 8).map((form) => (
              <div
                key={form.id}
                className="border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all bg-card flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <Link
                      href={`/studio/forms/${form.id}/builder`}
                      className="font-bold text-lg text-foreground group-hover:text-primary transition-colors cursor-pointer tracking-tight">
                      {form.title}
                    </Link>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
                        form.status?.toLowerCase() === "published"
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-warning/10 text-warning border border-warning/20"
                      }`}>
                      {form.status?.toLowerCase() === "published" ? t("dashboard.published") : t("dashboard.draft")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>
                      <span className="text-foreground font-medium">
                        {formatNumber(form.submissions || 0, i18n.language)}
                      </span>{" "}
                      {t("dashboard.responses")}
                    </span>
                  </div>
                </div>

                {/* ✅ Actions: Open Builder + Versions + View Details */}
                <div className="mt-5 pt-4 border-t border-border flex justify-end gap-3 flex-wrap">
                  <Link
                    href={`/studio/forms/${form.id}/builder`}
                    className="text-primary font-bold text-xs hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md">
                    {t("dashboard.openBuilder")}
                  </Link>
                  <Link
                    href={`/studio/forms/${form.id}/versions`}
                    className="text-warning font-bold text-xs hover:bg-warning/10 transition-colors px-3 py-1.5 rounded-md">
                    {t("dashboard.versions")}
                  </Link>
                  <Link
                    href={`/studio/forms/${form.id}/analytics`}
                    className="text-primary font-bold text-xs hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md">
                    {t("dashboard.viewDetails")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
