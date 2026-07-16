"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import ThemeLogo from "@/components/ThemeLogo";
import { useTranslation } from "react-i18next";

const getLoginSchema = (t: any) => z.object({
  email: z.string().email(t("login.emailRequired")),
  password: z.string().min(6, t("login.passwordMinLength")),
});

type LoginForm = z.infer<ReturnType<typeof getLoginSchema>>;

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchCurrentUser, currentUser, hasHydrated, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && isAuthenticated && currentUser) {
      const userRole = currentUser.role?.toUpperCase() || "USER";
      if (userRole === "SUPER_ADMIN") {
        router.push("/super-admin/dashboard");
      } else if (userRole === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/userForms");
      }
    }
  }, [hasHydrated, isAuthenticated, currentUser, router]);

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const schema = getLoginSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", data);
      const result = response.data;

      const token = result.accessToken || result.token;

      if (!token) {
        setApiError(t("login.authFailed"));
        setIsLoading(false);
        return;
      }

      // Save tokens in Zustand immediately
      useAuthStore.setState({
        accessToken: token,
        refreshToken: result.refreshToken || null,
        isAuthenticated: true,
      });

      // Fetch full user state
      await fetchCurrentUser();

      const state = useAuthStore.getState();
      if (!state.currentUser) {
        setApiError(t("login.profileFailed"));
        setIsLoading(false);
        return;
      }

      console.log('currentUser', state.currentUser);
      console.log('role', state.currentUser?.role);

      const userRole = state.currentUser.role?.toUpperCase() || "USER";

      if (userRole === "SUPER_ADMIN") {
        router.push("/super-admin/dashboard");
      } else if (userRole === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/userForms");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMsg =
        axiosError.response?.data?.message ||
        t("login.invalidCredentials");
      setApiError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-2xl relative overflow-hidden">
        {/* Decorative soft background glow */}
        <div className="absolute -top-10 -start-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -end-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="mb-5">
            <ThemeLogo width={180} height={58} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("login.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {apiError && (
            <div className="bg-error/15 border border-error/20 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("login.emailLabel")}
            </label>
            <div className="relative">
              <input
                type="email"
                {...register("email")}
                className="w-full ltr:ps-10 ltr:pe-3 rtl:pe-10 rtl:ps-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all"
                placeholder={t("login.emailPlaceholder")}
              />
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("login.passwordLabel")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full ltr:ps-10 ltr:pe-10 rtl:pe-10 rtl:ps-10 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all"
                placeholder={t("login.passwordPlaceholder")}
              />
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-muted-foreground focus:outline-none">
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-1.5">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 border border-primary/20">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("login.signingInBtn")}</span>
              </>
            ) : (
              <span>{t("login.signInBtn")}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
