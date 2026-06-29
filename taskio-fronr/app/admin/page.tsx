"use client";

import { useEffect, useState } from "react";
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
        console.error(error);

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
            title: "Customer Satisfaction Form",
            status: "Published",
            submissions: 86,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Forms Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">
          Manage your forms and submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500">Total Forms</p>
          <h3 className="text-3xl font-bold mt-2">{forms.length}</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500">Published</p>
          <h3 className="text-3xl font-bold mt-2">
            {forms.filter((f) => f.status === "Published").length}
          </h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <p className="text-slate-500">Submissions</p>
          <h3 className="text-3xl font-bold mt-2">
            {forms.reduce((acc, form) => acc + form.submissions, 0)}
          </h3>
        </div>
      </div>

      {/* Forms Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="text-xl font-bold mb-6">Recent Forms</h3>

        {loading ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="border rounded-2xl p-5 hover:shadow-md transition bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-lg text-slate-800">
                    {form.title}
                  </h4>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      form.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>

                <p className="text-slate-500 mt-3">
                  {form.submissions} submissions
                </p>

                <button className="mt-4 text-indigo-600 font-medium hover:underline">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
