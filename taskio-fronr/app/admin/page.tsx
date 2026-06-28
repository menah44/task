"use client";

import { useEffect, useState } from "react";
import apiClient, { tokenStore } from "@/lib/api/client";
import { useRouter } from "next/navigation";

interface Form {
  id: number;
  title: string;
  status: "Published" | "Draft";
  submissions: number;
}

export default function AdminDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    apiClient
      .get("/forms")
      .then((response) => {
        setForms(response.data);
      })
      .catch((error) => {
        console.error(error);

        // mock data لو backend مش جاهز
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

  const handleLogout = () => {
    tokenStore.clearTokens();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">FormFlow</h1>
          <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
        </div>

        <nav className="p-4 space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-600">
            Dashboard
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            Forms
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            Responses
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            Settings
          </button>
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-rose-500 hover:bg-rose-600 py-3 rounded-xl font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Navbar */}
        <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Forms Dashboard
            </h2>
            <p className="text-slate-500 text-sm">
              Manage your forms and submissions
            </p>
          </div>

          <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
            + Create Form
          </button>
        </header>

        {/* Content */}
        <main className="p-6">
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
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
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
      </div>
    </div>
  );
}
