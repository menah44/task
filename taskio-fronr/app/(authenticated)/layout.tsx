"use client";

import { useEffect } from "react";
import { useAuthStore, parseJwt } from "@/lib/auth-store";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

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
    accessToken,
  } = useAuthStore();

  const pathname = usePathname();
  const router = useRouter();

  // 1. Fetch current user if token exists but no user is loaded
  useEffect(() => {
    if (hasHydrated) {
      const token = accessToken;
      if (token && !currentUser) {
        fetchCurrentUser();
      }
    }
  }, [hasHydrated, currentUser, fetchCurrentUser, accessToken]);

  // 2. Role-based routing and access protection
  useEffect(() => {
    if (hasHydrated && !isLoading) {
      const token = accessToken;

      if (!token) {
        router.replace("/login");
        return;
      }

      if (currentUser) {
        const userRole = currentUser.role?.toUpperCase() || "USER";

        // ADMIN paths (/admin) and Forms Creation paths (/studio) are restricted to ADMIN only
        const isAdminPath = pathname?.startsWith("/admin");
        const isStudioPath = pathname?.startsWith("/studio");
        const isSuperAdminPath = pathname?.startsWith("/super-admin");
        const isFillPath = pathname?.includes("/fill");

        if (isSuperAdminPath && userRole !== "SUPER_ADMIN") {
          console.warn(
            "Unprivileged access attempt blocked. Redirecting to user forms...",
          );
          router.replace("/userForms");
        } else if (isAdminPath && userRole === "SUPER_ADMIN") {
          console.warn("Super Admin redirected to their correct dashboard...");
          router.replace("/super-admin/dashboard");
        } else if (
          (isAdminPath || (isStudioPath && !isFillPath)) &&
          userRole !== "ADMIN" &&
          userRole !== "SUPER_ADMIN"
        ) {
          console.warn(
            "Unprivileged access attempt blocked. Redirecting to user forms...",
          );
          router.replace("/userForms");
        }
      }
    }
  }, [hasHydrated, isLoading, currentUser, pathname, router, accessToken]);

  // 3. Background Silent Refresh check
  useEffect(() => {
    if (!currentUser) return;

    const checkAndRefresh = async () => {
      const token = accessToken;
      if (!token) return;

      try {
        const payload = parseJwt(token);
        if (!payload || !payload.exp) return;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - currentTime;

        // If token expires in 60 seconds or less, refresh silently
        if (timeLeft <= 60) {
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
  }, [currentUser, refreshAccessToken, accessToken]);

  // 4. Determine if we are in a loading/checking state
  const token = accessToken;
  const isChecking = !hasHydrated || (token && !currentUser && isLoading);

  if (isChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white"
        dir="ltr">
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

  // Full-bleed pages (the form builder and the fill page) are built as
  // their own h-screen app shells with their own internal scroll areas —
  // wrapping them in <main>'s p-6 padding + max-w-7xl centering is what
  // was producing the black gutter around the builder, and was also
  // squeezing its top nav width (causing the tab/button overlap).
  // Everything else keeps the normal padded, centered content area.
  const isFullBleedPage = /^\/studio\/forms\/[^/]+\/(builder|fill)(\/|$)/.test(
    pathname || "",
  );

  return (
    <div dir="ltr" className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex">
      {/* Reusable Sidebar */}
      <Sidebar userRole={userRole} pathname={pathname} logout={logout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reusable TopBar */}
        <TopBar name={currentUser.name || ""} email={currentUser.email || ""} />

        {isFullBleedPage ? (
          <main className="flex-1 overflow-hidden bg-[#0d1117]">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-6 overflow-y-auto bg-[#0d1117]">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        )}
      </div>
    </div>
  );
}
