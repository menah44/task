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
      .catch(() => {
        // mock data مؤقت
        setForms([
          {
            id: 1,
            title: "Customer Satisfaction Survey",
            description: "Help us improve our services.",
            status: "Open",
          },
          {
            id: 2,
            title: "Training Feedback Form",
            description: "Share your experience with the training.",
            status: "Open",
          },
          {
            id: 3,
            title: "Employee Feedback",
            description: "Internal company feedback form.",
            status: "Closed",
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Available Forms</h2>
        <p className="text-slate-500 mt-2">
          Complete the forms assigned to you
        </p>
      </div>

      {/* Forms */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-3xl border p-6 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {form.title}
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    form.status === "Open"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {form.status}
                </span>
              </div>

              <p className="text-slate-500 text-sm mb-6">{form.description}</p>

              <button
                disabled={form.status === "Closed"}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  form.status === "Open"
                    ? "bg-primary text-white hover:opacity-90"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                {form.status === "Open" ? "Fill Form" : "Closed"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
