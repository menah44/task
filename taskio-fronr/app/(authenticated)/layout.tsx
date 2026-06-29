"use client";

import { useEffect } from "react";
import { useAuthStore, parseJwt } from "@/lib/auth-store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Users, 
  User, 
  LogOut, 
  Loader2,
  Menu
} from "lucide-react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    currentUser,
    isLoading,
    hasHydrated,
    fetchCurrentUser,
    refreshAccessToken,
    logout,
  } = useAuthStore();

  const pathname = usePathname();
  const router = useRouter();

  // 1. Fetch current user if token exists but no user is loaded
  useEffect(() => {
    if (hasHydrated) {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (token && !currentUser && !isLoading) {
        fetchCurrentUser();
      }
    }
  }, [hasHydrated, currentUser, isLoading, fetchCurrentUser]);

  // 2. Role-based routing and access protection
  useEffect(() => {
    if (hasHydrated && !isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      
      if (!token) {
        router.replace("/login");
        return;
      }

      if (currentUser) {
        const userRole = currentUser.role?.toUpperCase() || "USER";
        
        // ADMIN paths (/admin) and Forms Creation paths (/studio) are restricted to ADMIN only
        const isAdminPath = pathname?.startsWith("/admin");
        const isStudioPath = pathname?.startsWith("/studio");

        if ((isAdminPath || isStudioPath) && userRole !== "ADMIN") {
          console.warn("Unprivileged access attempt blocked. Redirecting to user forms...");
          router.replace("/userForms");
        }
      }
    }
  }, [hasHydrated, isLoading, currentUser, pathname, router]);

  // 3. Background Silent Refresh check
  useEffect(() => {
    if (!currentUser) return;

    const checkAndRefresh = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) return;

      try {
        const payload = parseJwt(token);
        if (!payload || !payload.exp) return;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - currentTime;

        // If token expires in 60 seconds or less, refresh silently
        if (timeLeft <= 60) {
          console.log("🔄 JWT is close to expiry. Performing silent refresh...");
          await refreshAccessToken();
        }
      } catch (error) {
        console.error("Error checking/refreshing token in background:", error);
      }
    };

    // Run check immediately
    checkAndRefresh();

    // Check every 15 seconds in the background
    const interval = setInterval(checkAndRefresh, 15000);

    return () => clearInterval(interval);
  }, [currentUser, refreshAccessToken]);

  // 4. Determine if we are in a loading/checking state
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const isChecking = !hasHydrated || (token && !currentUser && isLoading);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white" dir="ltr">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-[#c9d1d9] text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // 5. If store is hydrated, not loading, and still no user, redirect to login
  if (!currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const userRole = currentUser.role?.toUpperCase() || "USER";

  return (
    <div dir="ltr" className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex">
      {/* Sidebar (on the left in LTR) */}
      <aside className="w-72 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          {/* Logo Section */}
          <div className="text-xl font-bold text-white mb-8 flex items-center justify-between border-b border-[#30363d] pb-4">
            <span className="tracking-tight flex items-center gap-2">
              <span className="text-blue-500 text-2xl font-black">■</span> Form
            </span>
            <span className="text-[10px] tracking-wider uppercase font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md">
              {userRole === "ADMIN" ? "Admin" : "User"}
            </span>
          </div>

          {/* Navigation Links based on user roles */}
          <nav className="space-y-1">
            {userRole === "ADMIN" ? (
              // ADMIN sidebar links
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname === "/admin" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "border border-transparent"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/studio/forms/new"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname === "/studio/forms/new" ? "bg-green-600/10 text-green-400 border border-green-600/20" : "border border-transparent"
                  }`}
                >
                  <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  <span>Create Form</span>
                </Link>

                <Link
                  href="/studio/forms"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname === "/studio/forms" ? "bg-purple-600/10 text-purple-400 border border-purple-600/20" : "border border-transparent"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  <span>Responses</span>
                </Link>

                <Link
                  href="/admin/users"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname?.startsWith("/admin/users") ? "bg-amber-600/10 text-amber-400 border border-amber-600/20" : "border border-transparent"
                  }`}
                >
                  <Users className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                  <span>User Management</span>
                </Link>
              </>
            ) : (
              // USER sidebar links
              <>
                <Link
                  href="/userForms"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname === "/userForms" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "border border-transparent"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span>My Forms</span>
                </Link>

                <Link
                  href="/profile"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                    pathname === "/profile" ? "bg-amber-600/10 text-amber-400 border border-amber-600/20" : "border border-transparent"
                  }`}
                >
                  <User className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                  <span>Profile</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-[#30363d] bg-[#161b22]/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium text-sm text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button className="md:hidden text-gray-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-semibold text-white">
              Welcome back, {currentUser.name || currentUser.email}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* User Profile Badge */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/10">
              {currentUser.email ? (
                currentUser.email[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-[#0d1117]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
