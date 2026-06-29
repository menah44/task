"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient, { tokenStore } from "@/lib/api/client"; // خطوة 7
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    tokenStore.setTokens(result.accessToken, result.refreshToken);

    if (result.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/userForms");
    }
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "response" in error) {
      const err = error as {
        response?: { status?: number };
      };

      if (err.response?.status === 401) {
        setApiError("Invalid credentials");
      } else if (err.response?.status === 403) {
        setApiError("Account deactivated");
      } else {
        setApiError("Login failed. Please try again.");
      }
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Left Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">FormFlow</h1>
          <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Welcome Back
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Sign in to manage forms, responses and users securely.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
                🔐
              </div>

              <h1 className="text-3xl font-bold text-slate-900">Login</h1>
              <p className="text-slate-500 mt-2">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-2">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-2">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
