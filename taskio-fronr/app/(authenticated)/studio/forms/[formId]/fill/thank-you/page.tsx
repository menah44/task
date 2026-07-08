"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-[#161b22] rounded-3xl border border-[#30363d] space-y-6" dir="ltr">
      <div className="p-4 bg-green-500/10 rounded-full border border-green-500/25">
        <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Submission Successful!</h2>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          Thank you for taking the time to fill out this form. Your response has been securely saved under your organization's records.
        </p>
      </div>
      <Link
        href="/userForms"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Return to My Forms
      </Link>
    </main>
  );
}
