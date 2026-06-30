"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";

interface Form {
  id: number;
  title: string;
  status: "Published" | "Draft";
  submissions: number;
}

export default function AdminDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    apiClient
      .get("/forms")
      .then((response) => {
        setForms(response.data);
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
            status: "Published",
            submissions: 86,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Form Dashboard
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage and monitor all active forms and submissions received.
          </p>
        </div>

        {/* ✅ NEW: Create Form button → goes to /studio/forms/new */}
        <Link
          href="/studio/forms/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          + Create Form
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161b22] rounded-2xl p-6 shadow-sm border border-[#30363d]">
          <p className="text-gray-400 text-sm font-medium">Total Forms</p>
          <h3 className="text-3xl font-bold mt-2 text-white">{forms.length}</h3>
        </div>

        <div className="bg-[#161b22] rounded-2xl p-6 shadow-sm border border-[#30363d]">
          <p className="text-gray-400 text-sm font-medium">Published Forms</p>
          <h3 className="text-3xl font-bold mt-2 text-green-400">
            {forms.filter((f) => f.status === "Published").length}
          </h3>
        </div>

        <div className="bg-[#161b22] rounded-2xl p-6 shadow-sm border border-[#30363d]">
          <p className="text-gray-400 text-sm font-medium">Total Submissions</p>
          <h3 className="text-3xl font-bold mt-2 text-blue-400">
            {forms.reduce((acc, form) => acc + form.submissions, 0)}
          </h3>
        </div>
      </div>

      {/* Recent Forms Section */}
      <div className="bg-[#161b22] rounded-3xl p-6 shadow-sm border border-[#30363d]">
        <h3 className="text-xl font-bold mb-6 text-white border-b border-[#30363d] pb-3">
          Recent Forms
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="border border-[#30363d] rounded-2xl p-5 hover:border-blue-500/50 hover:bg-[#1f242c] transition-all bg-[#0d1117] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    {/* ✅ NEW: title itself links to the builder */}
                    <Link
                      href={`/studio/forms/${form.id}/builder`}
                      className="font-semibold text-lg text-white hover:text-blue-400 transition-colors cursor-pointer">
                      {form.title}
                    </Link>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        form.status === "Published"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                      {form.status === "Published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mt-3">
                    Submissions:{" "}
                    <span className="text-gray-200 font-medium">
                      {form.submissions}
                    </span>{" "}
                    responses
                  </p>
                </div>

                {/* ✅ NEW: two actions — Open Builder + View Details */}
                <div className="mt-5 pt-3 border-t border-[#30363d]/50 flex justify-end gap-4">
                  <Link
                    href={`/studio/forms/${form.id}/builder`}
                    className="text-purple-400 font-medium text-sm hover:text-purple-300 transition-colors flex items-center gap-1">
                    Open Builder →
                  </Link>
                  <button className="text-blue-400 font-medium text-sm hover:text-blue-300 transition-colors flex items-center gap-1">
                    View Details & Reports →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
