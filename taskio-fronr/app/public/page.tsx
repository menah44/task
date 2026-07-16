// app/public/page.tsx
// ✅ No "use client" needed at top level — server component for SEO
// but we use client-side fetch for simplicity with the existing API client pattern

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { hasQuestions } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// ======================== Types ========================
interface PublicForm {
  id: number;
  title: string;
  description: string;
  status: "PUBLISHED" | "DRAFT" | "CLOSED";
  allowAnonymous: boolean;
}

// ======================== Skeleton ========================
function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
      <div className="h-5 bg-muted rounded-lg w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
      <div className="h-10 bg-muted rounded-xl w-full" />
    </div>
  );
}

// ======================== Empty State ========================
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-3xl mb-4">
        📋
      </div>
      <h3 className="text-foreground font-semibold text-lg mb-1">
        {t("publicForms.noPublicForms")}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {t("publicForms.noPublicFormsDesc")}
      </p>
    </div>
  );
}

// ======================== Form Card ========================
function FormCard({ form }: { form: PublicForm }) {
  const { t } = useTranslation();
  const isOpen = form.status === "PUBLISHED";

  return (
    <div className="bg-white border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="space-y-3">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground font-semibold text-base leading-snug line-clamp-2">
            {form.title}
          </h3>
          <span
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOpen
                ? "bg-green-50 text-success border-green-200"
                : "bg-muted text-muted-foreground border-border"
            }`}>
            {isOpen ? t("publicForms.open") : t("publicForms.closed")}
          </span>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
          {form.description || t("publicForms.noDescription")}
        </p>

        {/* Anonymous badge */}
        <div className="flex items-center gap-1.5 text-xs text-blue-500">
          <span>🔓</span>
          <span>{t("publicForms.noLoginRequired")}</span>
        </div>
      </div>

      {/* CTA Button */}
      {isOpen ? (
        <Link
          href={`/public/${form.id}`}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-center text-white bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors shadow-sm block">
          {t("publicForms.fillOutForm")}
        </Link>
      ) : (
        <button
          disabled
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-muted-foreground bg-muted border border-border cursor-not-allowed">
          {t("publicForms.formClosed")}
        </button>
      )}
    </div>
  );
}

// ======================== Main Page ========================
export default function PublicFormsPage() {
  const [forms, setForms] = useState<PublicForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // GET /forms/public (A2-09) — no auth token needed
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseURL}/forms/public`);
        if (res.ok) {
          const data: PublicForm[] = await res.json();
          // ✅ Only show allowAnonymous forms that have questions
          setForms(data.filter((f) => f.allowAnonymous && hasQuestions(f)));
        } else {
          setForms(getMockForms());
        }
      } catch {
        setForms(getMockForms());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-muted">
      {/* Navbar */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary text-2xl font-black">■</span>
            <span className="text-foreground font-bold text-lg">FormFlow</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-primary border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            {t("publicForms.signIn")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            {t("publicForms.title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("publicForms.subtitle")}
          </p>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : forms.length === 0 ? (
            <EmptyState />
          ) : (
            forms.map((form) => <FormCard key={form.id} form={form} />)
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          {t("publicForms.footer", { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}

// ======================== Mock Data ========================
function getMockForms(): PublicForm[] {
  return [
    {
      id: 1,
      title: "Customer Satisfaction Survey",
      description:
        "Help us improve our services by sharing your experience with us.",
      status: "PUBLISHED",
      allowAnonymous: true,
    },
    {
      id: 2,
      title: "Event Registration Form",
      description:
        "Register for our upcoming community event. Open to everyone.",
      status: "PUBLISHED",
      allowAnonymous: true,
    },
    {
      id: 3,
      title: "Feedback & Suggestions",
      description: "Share your thoughts and ideas to help us grow.",
      status: "CLOSED",
      allowAnonymous: true,
    },
  ];
}
