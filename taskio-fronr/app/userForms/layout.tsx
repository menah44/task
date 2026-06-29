"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import { tokenStore } from "@/lib/api/client";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [user, setUser] = useState({
    role: "USER",
    email: "",
  });

  useEffect(() => {
    setUser({
      role: localStorage.getItem("userRole") || "USER",
      email: localStorage.getItem("userEmail") || "user@taskio.com",
    });
  }, []);

  const handleLogout = () => {
    tokenStore.clearTokens();
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-slate-800">
          <h1 className="text-3xl font-bold tracking-tight">
            Taskio <span className="text-primary">Pro</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">User Workspace</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-primary font-medium">
            Available Forms
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            My Submissions
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            Profile
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 transition font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* TopBar */}
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              User Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              Complete your assigned forms
            </p>
          </div>

          <UserMenu name={user.role} email={user.email} />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
