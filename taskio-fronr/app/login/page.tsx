"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { fetchCurrentUser } = useAuthStore();

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", data);
      const result = response.data;

      const token = result.accessToken || result.token;

      if (!token) {
        setApiError("Authentication token not found in server response.");
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
        setApiError("Failed to fetch user profile after authentication.");
        setIsLoading(false);
        return;
      }

      const userRole = state.currentUser.role?.toUpperCase() || "USER";

      if (userRole === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/userForms");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMsg = axiosError.response?.data?.message || "Invalid credentials. Please try again.";
      setApiError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md bg-[#161b22] p-8 rounded-xl border border-[#30363d] shadow-2xl relative overflow-hidden" dir="ltr">
        {/* Decorative soft background glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back to Form</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                {...register("email")}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-left"
                placeholder="you@example.com"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-left"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 border border-blue-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
