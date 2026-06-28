import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserType {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthState {
  currentUser: UserType | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (user: UserType, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      accessToken: null,

      login: (user, token) =>
        set({
          currentUser: user,
          isAuthenticated: true,
          accessToken: token,
        }),

      logout: () =>
        set({
          currentUser: null,
          isAuthenticated: false,
          accessToken: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage), // الحفظ المستمر في الـ sessionStorage
    },
  ),
);
