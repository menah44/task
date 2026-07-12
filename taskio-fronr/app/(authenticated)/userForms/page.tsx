"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Play, HelpCircle } from "lucide-react";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";
import { hasQuestions } from "@/lib/utils";

interface FormItem {
  id: string | number;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
}

export default function UserFormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const [formsRes, submissionsRes] = await Promise.all([
          apiClient.get("/forms", { params: { status: "published" } }),
          apiClient.get("/responses/my-submissions")
        ]);
        
        const items = formsRes.data.items || [];
        const submittedFormIds = new Set(submissionsRes.data.map((s: any) => s.formId));

        // Only show published forms that have questions AND haven't been submitted
        const availableForms = items.filter((form: FormItem) => 
          hasQuestions(form) && !submittedFormIds.has(form.id)
        );
        
        setForms(availableForms);
      } catch (err) {
        console.error("Failed to fetch user forms:", err);
        setError("Could not load your organization's forms. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-blue-500" />
          Available Forms
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select an active form below to submit responses for your organization.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 4].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-error/20">
          <div className="p-4 bg-error/15 rounded-full border border-red-500/25 mb-4">
            <HelpCircle className="w-12 h-12 text-error" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Error Loading Forms</h3>
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-border">
          <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/25 mb-4">
            <ClipboardList className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Forms</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            There are currently no published forms available for your organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="border border-border rounded-2xl p-6 hover:border-blue-500/50 hover:bg-muted transition-all bg-card shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-xl text-foreground tracking-tight">
                  {form.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                  {form.description || "No description provided for this form."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Updated: {new Date(form.updatedAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/studio/forms/${form.id}/fill`}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Fill Form
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
