"use client";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";

export function useUserTheme() {
  const { theme, setTheme, systemTheme } = useTheme();

  const handleSetTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    
    // Dispatch an API call to sync preference to backend
    const state = useAuthStore.getState();
    const token = state.accessToken;
    
    if (token) {
      // Optimistically update the local Zustand store
      // This prevents layout.tsx from restoring the old theme when it re-renders
      if (state.currentUser) {
        useAuthStore.setState({
          currentUser: { ...state.currentUser, theme: newTheme }
        });
      }

      apiClient.patch('/users/me/preferences', { theme: newTheme }).catch(console.error);
    }
  }, [setTheme]);

  return {
    theme,
    setTheme: handleSetTheme,
    systemTheme,
  };
}
