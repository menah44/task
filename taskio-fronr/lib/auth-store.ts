import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "./api/client";

// Module-level variable to store the silent refresh timeout ID
let refreshTimeoutId: any = null;

// Unicode-safe JWT decoder helper
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
}

export interface UserType {
  id?: string | number;
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  [key: string]: unknown;
}

interface AuthState {
  currentUser: UserType | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (user: UserType, token: string, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  startAutoRefresh: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      hasHydrated: false,

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      login: (user, token, refreshToken = null) => {
        set({
          currentUser: user,
          isAuthenticated: true,
          accessToken: token,
          refreshToken: refreshToken,
          isLoading: false,
        });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });

        const token = get().accessToken;

        if (!token) {
          set({
            currentUser: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });
          return;
        }

        try {
          const res = await apiClient.get("/users/me");

          set({
            currentUser: res.data,
            isAuthenticated: true,
            accessToken: token,
            isLoading: false,
          });

          get().startAutoRefresh();
        } catch (error) {
          console.error("Failed to fetch current user:", error);

          set({
            currentUser: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });
        }
      },

      refreshAccessToken: async () => {
        try {
          const refreshToken = get().refreshToken;

          if (!refreshToken) {
            await get().logout();
            throw new Error("No refresh token available");
          }

          const res = await apiClient.post("/auth/refresh", {
            refreshToken,
          });

          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || refreshToken,
            isAuthenticated: true,
          });

          get().startAutoRefresh();
        } catch (error) {
          console.error("Token refresh failed, logging out:", error);
          await get().logout();
          throw error; // Reject the promise
        }
      },

      startAutoRefresh: () => {
        const token = get().accessToken;

        if (!token) return;

        try {
          const payload = parseJwt(token);
          if (!payload || !payload.exp) return;

          const expiry = payload.exp * 1000;
          const now = Date.now();

          // Refresh token 60 seconds before it expires
          const refreshTime = expiry - now - 60000;

          if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
          }

          if (refreshTime <= 0) {
            get().refreshAccessToken();
          } else {
            refreshTimeoutId = setTimeout(() => {
              get().refreshAccessToken();
            }, refreshTime);
          }
        } catch (error) {
          console.error("Failed to decode token for auto-refresh:", error);
        }
      },

      logout: async () => {
        const token = get().accessToken;
        try {
          if (token) {
            await apiClient.post("/auth/logout", {});
          }
        } catch (error) {
          console.error("Server logout failed:", error);
        } finally {
          if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
          }

          // Clear storage keys as a fail-safe
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();

            // Clear all cookies
            document.cookie.split(";").forEach((cookie) => {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
          }

          set({
            currentUser: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.startAutoRefresh();
      },
      partialize: (state) => {
        // Explicitly return only the serializable persistent fields
        return {
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        };
      },
    }
  )
);
