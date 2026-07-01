"use client";

import { useEffect } from "react";
import apiClient from "../api/client";
import { useAuthStore, parseJwt } from "@/lib/auth-store";

export function useAuthRefresh() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const checkAndRefresh = async () => {
      // 1. Get Access Token from the Zustand store
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) return;

      // 2. Decode JWT to read expiration (exp)
      const payload = parseJwt(accessToken);
      if (!payload || !payload.exp) return;

      // 3. Calculate remaining seconds
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - currentTime;

      // 4. Silent refresh if time left is <= 60 seconds
      if (timeLeft <= 60) {
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) return;

          const res = await apiClient.post("/auth/refresh", {
            refreshToken,
          });

          // 5. Store new tokens in Zustand immediately upon success
          if (res.status === 200) {
            const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
            
            useAuthStore.setState({
              accessToken: newAccess,
              refreshToken: newRefresh || refreshToken,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error(
            "❌ Automated silent refresh failed, logging out...",
            error
          );
          logout();
        }
      }
    };

    checkAndRefresh();

    // Check every 15 seconds in the background
    const interval = setInterval(checkAndRefresh, 15000);

    return () => clearInterval(interval);
  }, [logout]);
}
