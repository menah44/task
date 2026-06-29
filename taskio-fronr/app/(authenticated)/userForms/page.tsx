"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";

interface Form {
  id: number;
  title: string;
  description: string;
  status: "Open" | "Closed";
}

export default function UserFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/forms")
      .then((res) => setForms(res.data))
      .catch((err) => {
        console.warn("Forms API failed or returned 404, using fallback mock data:", err);
        // Fallback mock data translated to English
        setForms([
          {
            id: 1,
            title: "Customer Satisfaction Survey",
            description: "Help us improve and develop the quality of the services provided to you.",
            status: "Open",
          },
          {
            id: 2,
            title: "Training Program Feedback",
            description: "Share your thoughts, experiences, and feedback on your current training.",
            status: "Open",
          },
          {
            id: 3,
            title: "Internal Suggestions & Grievances",
            description: "A dedicated space for sending constructive feedback to senior management.",
            status: "Closed",
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Available Forms
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Please fill out your assigned forms before the deadline.
        </p>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 shadow-sm hover:border-blue-500/30 hover:bg-[#1f242c] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="text-lg font-bold text-white line-clamp-2">
                    {form.title}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      form.status === "Open"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {form.status === "Open" ? "Available" : "Closed"}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                  {form.description}
                </p>
              </div>

              <button
                disabled={form.status === "Closed"}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${
                  form.status === "Open"
                    ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-md"
                    : "bg-[#21262d] text-gray-500 border-[#30363d] cursor-not-allowed"
                }`}
              >
                {form.status === "Open"
                  ? "Start Filling Form"
                  : "Form Closed"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
