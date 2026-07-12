"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

export default function CreateUserPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "USER",
    groupId: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, groupsRes] = await Promise.all([
          apiClient.get('/roles'),
          apiClient.get('/groups')
        ]);
        
        let availableRoles = rolesRes.data;
        if (currentUser?.role?.toUpperCase() !== 'SUPER_ADMIN') {
          availableRoles = availableRoles.filter((r: any) => r.name.toUpperCase() !== 'SUPER_ADMIN');
        }

        setRoles(availableRoles);
        setGroups(groupsRes.data);
        if (availableRoles.length > 0) {
          setFormData(prev => ({ ...prev, role: availableRoles[0].name }));
        }
      } catch (err) {
        console.error("Failed to fetch roles or groups", err);
      }
    };
    fetchData();
  }, []);

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
      const { groupId, ...rest } = formData;
      const submitData = {
        ...rest,
        groupId: groupId ? Number(groupId) : undefined,
      };
      const response = await apiClient.post("/users", submitData);
      if (response.status === 201) {
        alert("User created successfully");
        router.push(`/admin/users/${response.data.id}`);
      }
    } catch (err: unknown) {
      const error = err as any;
      if (error.response?.status === 409) { // Conflict
        const msg = error.response.data?.message;
        if (msg?.includes("Username")) {
          setFieldErrors({ username: msg });
        } else if (msg?.includes("Email")) {
          setFieldErrors({ email: msg });
        } else {
          setApiError(msg || "Conflict error");
        }
      } else if (error.response?.status === 422 || error.response?.status === 400) {
        const errors = error.response.data?.errors || error.response.data?.message;
        
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
          setApiError(error.response.data?.message || "Validation failed. Please check your inputs.");
        }
      } else {
        setApiError(error.response?.data?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Create New User
          </h2>
          <Link
            href="/admin/users"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2"
          >
            ← Back to Users
          </Link>
        </div>

        {/* Top Alert Error Box */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-error/15 border border-error/20 text-error text-sm">
            {apiError}
          </div>
        )}

        {/* Card Form */}
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grid for First/Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-background border ${
                    fieldErrors.firstName ? "border-red-500" : "border-border"
                  } rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all`}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-background border ${
                    fieldErrors.lastName ? "border-red-500" : "border-border"
                  } rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all`}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Username <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full bg-background border ${
                  fieldErrors.username ? "border-red-500" : "border-border"
                } rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="johndoe123"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-error">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full bg-background border ${
                  fieldErrors.email ? "border-red-500" : "border-border"
                } rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="john@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full bg-background border ${
                  fieldErrors.password ? "border-red-500" : "border-border"
                } rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all`}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-error">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role <span className="text-error">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={`w-full bg-background border ${
                  fieldErrors.role ? "border-red-500" : "border-border"
                } rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all appearance-none uppercase`}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-error">{fieldErrors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Group
              </label>
              <select
                name="groupId"
                value={formData.groupId}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Select a group (optional)...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
