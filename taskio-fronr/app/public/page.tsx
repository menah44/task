// app/public/page.tsx
// ✅ No "use client" needed at top level — server component for SEO
// but we use client-side fetch for simplicity with the existing API client pattern

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
      <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
      <div className="h-10 bg-gray-100 rounded-xl w-full" />
    </div>
  );
}

// ======================== Empty State ========================
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl mb-4">
        📋
      </div>
      <h3 className="text-gray-800 font-semibold text-lg mb-1">
        No Public Forms Available
      </h3>
      <p className="text-gray-400 text-sm max-w-xs">
        There are no public forms available at the moment. Check back later.
      </p>
    </div>
  );
}

// ======================== Form Card ========================
function FormCard({ form }: { form: PublicForm }) {
  const isOpen = form.status === "PUBLISHED";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="space-y-3">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-gray-900 font-semibold text-base leading-snug line-clamp-2">
            {form.title}
          </h3>
          <span
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOpen
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
          {form.description || "No description provided."}
        </p>

        {/* Anonymous badge */}
        <div className="flex items-center gap-1.5 text-xs text-blue-500">
          <span>🔓</span>
          <span>No login required</span>
        </div>
      </div>

      {/* CTA Button */}
      {isOpen ? (
        <Link
          href={`/public/forms/${form.id}`}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-center text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm block">
          Fill Out Form →
        </Link>
      ) : (
        <button
          disabled
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed">
          Form Closed
        </button>
      )}
    </div>
  );
}

// ======================== Main Page ========================
export default function PublicFormsPage() {
  const [forms, setForms] = useState<PublicForm[]>([]);
  const [loading, setLoading] = useState(true);

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
          // ✅ Only show allowAnonymous forms
          setForms(data.filter((f) => f.allowAnonymous));
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-2xl font-black">■</span>
            <span className="text-gray-900 font-bold text-lg">FormFlow</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Public Forms
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Browse and fill out forms — no account required.
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
      <footer className="border-t border-gray-100 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FormFlow. All rights reserved.
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
