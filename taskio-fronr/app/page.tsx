"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck, Sparkles, Layout } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-[#0d1117] text-[#c9d1d9]" dir="ltr">
      {/* Sidebar Info Section */}
      <aside className="hidden md:flex w-80 bg-[#161b22] border-r border-[#30363d] flex-col justify-between p-8 relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="border-b border-[#30363d] pb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500 text-3xl font-black">■</span> Form
          </h1>
          <p className="text-sm text-gray-400 mt-1">Form & Workflow Management</p>
        </div>

        <div className="flex-1 flex flex-col justify-center py-10 space-y-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight mb-3">
              Smart Form Operations
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create dynamic questionnaires, allocate items to responders, and track submissions from a single premium console.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          © 2026 Form. All privileges reserved.
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-xl w-full">
          <div className="bg-[#161b22] rounded-3xl border border-[#30363d] shadow-2xl p-10 md:p-14 text-center space-y-8 relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-4xl shadow-inner">
              <ClipboardCheck className="w-10 h-10 text-blue-500" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Welcome to Form
              </h1>
              <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                A premium, modern workspace for designing beautiful responsive forms, managing role permissions, and reviewing logs.
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg border border-blue-500/20 flex items-center gap-2"
              >
                <Layout className="w-5 h-5" /> Get Started
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
