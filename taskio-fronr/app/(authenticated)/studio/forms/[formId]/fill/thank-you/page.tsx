"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-card rounded-3xl border border-border space-y-6" dir="ltr">
      <div className="p-4 bg-success/15 rounded-full border border-green-500/25">
        <CheckCircle className="w-16 h-16 text-success animate-bounce" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Submission Successful!</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Thank you for taking the time to fill out this form. Your response has been securely saved under your organization's records.
        </p>
      </div>
      <Link
        href="/userForms"
        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Return to My Forms
      </Link>
    </main>
  );
}
