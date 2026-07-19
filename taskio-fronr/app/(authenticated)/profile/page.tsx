"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { User, Mail, Shield, Save, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!currentUser) return null;

  return (
    <main className="space-y-8 text-foreground">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-blue-500" />
          {t("profile.title")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-extrabold text-3xl shadow-lg border-2 border-border">
            {email ? email[0].toUpperCase() : "U"}
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">{name || email}</h3>
            <p className="text-muted-foreground text-xs mt-1">{email}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground border-transparent shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            {currentUser.role === "SUPER_ADMIN"
              ? t("profile.superAdmin")
              : currentUser.role === "ADMIN"
              ? t("profile.sysAdmin")
              : t("profile.standardUser")}
          </span>
        </div>

        {/* Update Profile Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6 border-b border-border pb-3">
            {t("profile.editProfile")}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSaved && (
              <div className="bg-success/15 border border-success/20 text-success text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{t("profile.savedSuccess")}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("profile.fullName")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all"
                    placeholder={t("profile.namePlaceholder")}
                  />
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground ">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("profile.email")}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all"
                    placeholder={t("profile.emailPlaceholder")}
                  />
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground ">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t("profile.sysPrivileges")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    currentUser.role === "SUPER_ADMIN"
                      ? t("profile.superAdminPriv")
                      : currentUser.role === "ADMIN"
                      ? t("profile.adminPriv")
                      : t("profile.userPriv")
                  }
                  disabled
                  className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-card border border-border text-muted-foreground cursor-not-allowed"
                />
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground ">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl transition-all font-semibold shadow-md text-sm border border-blue-500/20"
              >
                <Save className="w-4 h-4" />
                {t("profile.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
