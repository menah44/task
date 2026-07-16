"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList, ExternalLink, Play, Square, ShieldAlert, BarChart3, Trash } from "lucide-react";
import { hasQuestions } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatters";

interface FormPermissions {
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
}

interface FormItem {
  id: string | number;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  permissions: FormPermissions;
}

import apiClient from "@/lib/api/client";

const fetchStudioForms = async (): Promise<FormItem[]> => {
  try {
    const response = await apiClient.get("/forms");
    return response.data.items || [];
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    return [];
  }
};

export default function StudioFormsPage() {
  const { t, i18n } = useTranslation();
  const { data: forms, isLoading } = useQuery<FormItem[]>({
    queryKey: ["accessible-forms"],
    queryFn: fetchStudioForms,
    staleTime: 60 * 1000,
  });

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      await apiClient.patch(`/forms/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessible-forms"] });
    },
    onError: (err: any) => {
      console.error("Failed to update status", err);
      const msg = err?.response?.data?.message || t("studioForms.failedUpdateStatus");
      alert(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessible-forms"] });
    },
    onError: (err) => {
      console.error("Failed to delete form", err);
      alert(t("studioForms.failedDelete"));
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            {t("studioForms.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("studioForms.desc")}
          </p>
        </div>
        <Link
          href="/studio/forms/new"
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] text-sm font-semibold rounded-full transition-all duration-200 border border-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-2"
        >
          {t("studioForms.createNewForm")}
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-start text-sm">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-xs font-semibold tracking-wider border-b border-border/60">
              <tr>
                <th className="px-6 py-5 ltr:text-start rtl:text-end">{t("studioForms.tableTitle")}</th>
                <th className="px-6 py-5 ltr:text-start rtl:text-end">{t("studioForms.tableStatus")}</th>
                <th className="px-6 py-5 ltr:text-start rtl:text-end">{t("studioForms.tableUpdated")}</th>
                <th className="px-6 py-5 ltr:text-end rtl:text-start">{t("studioForms.tableActions")}</th>
              </tr>
            </thead>
            <tbody className="text-sm text-muted-foreground">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <tr
                    key={form.id}
                    className="hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0 group"
                  >
                    {/* Title */}
                    <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                      {form.title}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          form.status?.toUpperCase() === "PUBLISHED"
                            ? "bg-success/10 text-success border border-success/20"
                            : form.status?.toUpperCase() === "DRAFT"
                              ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {form.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {form.updatedAt ? new Intl.DateTimeFormat(i18n.language, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(form.updatedAt)) : "N/A"}
                    </td>



                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-end flex items-center justify-end gap-2 opacity-100 transition-opacity">
                      <Link
                        href={`/studio/forms/${form.id}/builder`}
                        className="px-3 py-1.5 rounded-full bg-blue-500/10 text-primary hover:bg-primary hover:text-primary-foreground border border-transparent transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {t("studioForms.builder")}
                      </Link>

                      {form.status?.toUpperCase() !== "PUBLISHED" ? (
                        <button
                          onClick={() => {
                            if (!hasQuestions(form)) {
                              alert(t("studioForms.publishRequirement"));
                              return;
                            }
                            statusMutation.mutate({ id: form.id, status: "PUBLISHED" });
                          }}
                          disabled={statusMutation.isPending || !hasQuestions(form)}
                          title={!hasQuestions(form) ? t("studioForms.publishRequirement") : t("studioForms.publish")}
                          className="px-3 py-1.5 rounded-full bg-success/10 text-success hover:bg-success hover:text-white border border-transparent transition-all inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="w-3.5 h-3.5" /> {t("studioForms.publish")}
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: form.id, status: "DRAFT" })}
                          disabled={statusMutation.isPending}
                          className="px-3 py-1.5 rounded-full bg-warning/10 text-warning hover:bg-warning hover:text-white border border-transparent transition-all inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Square className="w-3.5 h-3.5" /> {t("studioForms.unpublish")}
                        </button>
                      )}

                      <button
                        disabled={!form.permissions?.canDelete || deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(t("studioForms.deleteConfirm"))) {
                            deleteMutation.mutate(form.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 text-xs font-semibold border border-transparent ${
                          form.permissions?.canDelete
                            ? "bg-error/10 text-error hover:bg-error hover:text-white cursor-pointer"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        <Trash className="w-3.5 h-3.5" /> {t("studioForms.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    {t("studioForms.noFormsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
