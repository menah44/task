"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { User, Mail, Shield, Save, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!currentUser) return null;

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-blue-500" />
          My Profile
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          View and update your account information and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-foreground font-extrabold text-3xl shadow-lg border-2 border-border">
            {email ? email[0].toUpperCase() : "U"}
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">{name || email}</h3>
            <p className="text-muted-foreground text-xs mt-1">{email}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground border-transparent shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            {currentUser.role === "ADMIN" ? "System Administrator" : "Standard User"}
          </span>
        </div>

        {/* Update Profile Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6 border-b border-border pb-3">
            Edit Profile Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSaved && (
              <div className="bg-success/15 border border-success/20 text-success text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Profile changes saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all text-left"
                    placeholder="Enter your full name"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all text-left"
                    placeholder="you@example.com"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                System Privileges
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentUser.role === "ADMIN" ? "ADMIN (Full Privileges)" : "USER (Restricted Privileges)"}
                  disabled
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-card border border-border text-muted-foreground cursor-not-allowed text-left"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
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
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
