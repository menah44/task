"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Eye, HelpCircle } from "lucide-react";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";

interface SubmissionItem {
  id: string | number;
  formId: string | number;
  status: string;
  submittedAt: string;
  form: {
    id: string | number;
    title: string;
  };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/responses/my-submissions");
        setSubmissions(response.data || []);
      } catch (err) {
        console.error("Failed to fetch user submissions:", err);
        setError("Could not load your submissions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-500" />
          My Submissions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          View forms that you have already submitted.
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
          <h3 className="text-xl font-bold text-foreground mb-2">Error Loading Submissions</h3>
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-border">
          <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/25 mb-4">
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Submissions Yet</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            You have not submitted any forms yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="border border-border rounded-2xl p-6 hover:border-blue-500/50 hover:bg-muted transition-all bg-card shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-xl text-foreground tracking-tight">
                  {sub.form?.title || "Untitled Form"}
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  <span className="inline-block px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-xs font-semibold uppercase tracking-wide">
                    Submitted
                  </span>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Date: {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                </span>
                <Link
                  href={`/submissions/${sub.id}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
