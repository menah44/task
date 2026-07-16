"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck, Sparkles, Layout } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Info Section */}
      <aside className="hidden md:flex w-80 bg-card border-e border-border flex-col justify-between p-8 relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute -top-10 -start-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-blue-500 text-3xl font-black">■</span> FormFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("landing.tagline", "Form & Workflow Management")}</p>
        </div>

        <div className="flex-1 flex flex-col justify-center py-10 space-y-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground leading-tight mb-3">
              {t("landing.feature1Title", "Smart Form Operations")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("landing.feature1Desc", "Create dynamic questionnaires, allocate items to responders, and track submissions from a single premium console.")}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {t("landing.copyright", "© 2026 FormFlow. All privileges reserved.")}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute -bottom-10 -end-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-xl w-full">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-10 md:p-14 text-center space-y-8 relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm/10 border border-primary/20 flex items-center justify-center text-4xl shadow-inner">
              <ClipboardCheck className="w-10 h-10 text-primary-foreground" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                {t("landing.welcome", "Welcome to FormFlow")}
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                {t("landing.description", "A premium, modern workspace for designing beautiful responsive forms, managing role permissions, and reviewing logs.")}
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-white font-bold rounded-xl transition-all shadow-lg border border-blue-500/20 flex items-center gap-2"
              >
                <Layout className="w-5 h-5" /> {t("landing.getStarted", "Get Started")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
