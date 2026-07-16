"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ThankYouPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-card rounded-3xl border border-border space-y-6">
      <div className="p-4 bg-success/15 rounded-full border border-green-500/25">
        <CheckCircle className="w-16 h-16 text-success animate-bounce" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">{t("thankYou.title")}</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          {t("thankYou.message")}
        </p>
      </div>
      <Link
        href="/userForms"
        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("thankYou.returnBtn")}
      </Link>
    </main>
  );
}
