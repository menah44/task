import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Module-level variable to store the silent refresh timeout ID
let refreshTimeoutId: NodeJS.Timeout | null = null;

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
  isLoading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (user: UserType, token: string) => void;
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
      isLoading: true,
      hasHydrated: false,

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      login: (user, token) => {
        set({
          currentUser: user,
          isAuthenticated: true,
          accessToken: token,
          isLoading: false,
        });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });

        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        if (!token) {
          set({
            currentUser: null,
            isAuthenticated: false,
            accessToken: null,
            isLoading: false,
          });
          return;
        }

        try {
          const res = await axios.get(`${baseURL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          set({
            currentUser: res.data,
            isAuthenticated: true,
            accessToken: token,
            isLoading: false,
          });

          get().startAutoRefresh();
        } catch (error) {
          console.error("Failed to fetch current user:", error);

          // If validation fails (e.g. 401 or 404), clean up local tokens immediately
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }

          set({
            currentUser: null,
            isAuthenticated: false,
            accessToken: null,
            isLoading: false,
          });
        }
      },

      refreshAccessToken: async () => {
        try {
          const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

          if (!refreshToken) {
            await get().logout();
            return;
          }

          const res = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });

          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
            }
          }

          set({
            accessToken: newAccessToken,
            isAuthenticated: true,
          });

          get().startAutoRefresh();
        } catch (error) {
          console.error("Token refresh failed, logging out:", error);
          await get().logout();
        }
      },

      startAutoRefresh: () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : get().accessToken;

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
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        try {
          if (token) {
            await axios.post(
              `${baseURL}/auth/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }
        } catch (error) {
          console.error("Server logout failed:", error);
        } finally {
          if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
          }

          // Clear local and session storage
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
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => {
        // Explicitly return only the serializable persistent fields
        return {
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          accessToken: state.accessToken,
        };
      },
    }
  )
);
