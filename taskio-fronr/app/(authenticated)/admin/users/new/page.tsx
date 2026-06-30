"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import Link from "next/link";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "USER",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    // Client-side validation
    if (formData.password.length < 6) {
      setFieldErrors({ password: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/users", formData);
      if (response.status === 201) {
        alert("User created successfully");
        router.push(`/admin/users/${response.data.id}`);
      }
    } catch (err: any) {
      if (err.response?.status === 409) { // Conflict
        const msg = err.response.data?.message;
        if (msg?.includes("Username")) {
          setFieldErrors({ username: msg });
        } else if (msg?.includes("Email")) {
          setFieldErrors({ email: msg });
        } else {
          setApiError(msg || "Conflict error");
        }
      } else if (err.response?.status === 422 || err.response?.status === 400) {
        const errors = err.response.data?.errors || err.response.data?.message;
        
        // Handle common validation error response formats
        if (typeof errors === 'object' && !Array.isArray(errors) && errors !== null) {
          const newErrors: Record<string, string> = {};
          for (const key in errors) {
            newErrors[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
          }
          setFieldErrors(newErrors);
        } else if (Array.isArray(errors)) {
           const newErrors: Record<string, string> = {};
           errors.forEach((msg: string) => {
             const field = msg.split(' ')[0]; // Basic attempt to extract field name
             newErrors[field] = msg;
           });
           setFieldErrors(newErrors);
        } else {
          setApiError(err.response.data?.message || "Validation failed. Please check your inputs.");
        }
      } else {
        setApiError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Create New User
          </h2>
          <Link
            href="/admin/users"
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            ← Back to Users
          </Link>
        </div>

        {/* Top Alert Error Box */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        {/* Card Form */}
        <div className="bg-[#161b22] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#30363d]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grid for First/Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-[#0d1117] border ${
                    fieldErrors.firstName ? "border-red-500" : "border-[#30363d]"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-[#0d1117] border ${
                    fieldErrors.lastName ? "border-red-500" : "border-[#30363d]"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full bg-[#0d1117] border ${
                  fieldErrors.username ? "border-red-500" : "border-[#30363d]"
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="johndoe123"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full bg-[#0d1117] border ${
                  fieldErrors.email ? "border-red-500" : "border-[#30363d]"
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="john@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full bg-[#0d1117] border ${
                  fieldErrors.password ? "border-red-500" : "border-[#30363d]"
                } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={`w-full bg-[#0d1117] border ${
                  fieldErrors.role ? "border-red-500" : "border-[#30363d]"
                } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none`}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.role}</p>
              )}
            </div>

            <div className="pt-4 border-t border-[#30363d]">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating User...
                  </>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
