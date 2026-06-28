"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">FormFlow</h1>
          <p className="text-sm text-slate-400 mt-1">Management System</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Smart Form Management
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Create forms, collect responses, and manage everything in one
              secure dashboard.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10 md:p-14">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl">
                📋
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Welcome to FormFlow
              </h1>

              <p className="mt-5 text-slate-500 text-lg leading-relaxed max-w-xl mx-auto">
                A modern platform for building forms, tracking submissions, and
                managing workflows efficiently.
              </p>
            </div>

        

            {/* CTA */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
