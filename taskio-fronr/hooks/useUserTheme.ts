"use client";
import { useTheme } from "next-themes";
import { useCallback } from "react";

export function useUserTheme() {
  const { theme, setTheme, systemTheme } = useTheme();

  const handleSetTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    // TODO: In the future, dispatch an API call to sync preference to backend:
    // apiClient.patch('/users/me/preferences', { theme: newTheme }).catch(console.error);
  }, [setTheme]);

  return {
    theme,
    setTheme: handleSetTheme,
    systemTheme,
  };
}
