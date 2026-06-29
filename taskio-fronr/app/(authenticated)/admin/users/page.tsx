"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, ArrowRight, ShieldCheck, Mail, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  joinedDate?: string;
}

export default function UserManagementPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal State Variables for Create User
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalRole, setModalRole] = useState<"ADMIN" | "USER">("USER");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  
  const limit = 5; // Standard items per page

  // 1. Search Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 whenever search query shifts
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // 2. Fetch Users function
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/users", {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      const data = response.data;
      // Filter out the current logged-in admin from the list (frontend safeguard)
      // Note: total/totalPages reflect server counts — acceptable trade-off vs. server-side change
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load users:", err);
      setError("Failed to retrieve users list from the server.");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 3. User Deactivation Handler
  const handleDeactivate = async (id: number, name: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to deactivate ${name}'s account? This user will no longer be able to log in.`
    );
    
    if (!isConfirmed) return;

    try {
      await apiClient.patch(`/users/${id}/deactivate`);
      fetchUsers(); // Refresh the list
    } catch (err: unknown) {
      console.error("Deactivation failed:", err);
      alert("Failed to deactivate account. Please check user permissions.");
    }
  };

  // 3b. User Activation Handler
  const handleActivate = async (id: number, name: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to enable ${name}'s account? This user will be able to log in again.`
    );
    
    if (!isConfirmed) return;

    try {
      await apiClient.patch(`/users/${id}/activate`);
      fetchUsers(); // Refresh the list
    } catch (err: unknown) {
      console.error("Activation failed:", err);
      alert("Failed to enable account. Please check user permissions.");
    }
  };

  // 4. Create User Submission Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!modalEmail.trim()) {
      setModalError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalEmail.trim())) {
      setModalError("Please enter a valid email address.");
      return;
    }
    if (!modalPassword || modalPassword.length < 6) {
      setModalError("Password must be at least 6 characters long.");
      return;
    }

    setModalLoading(true);
    try {
      await apiClient.post("/users", {
        name: modalName.trim() || undefined,
        email: modalEmail.trim(),
        password: modalPassword,
        role: modalRole,
      });

      // Reset and close modal
      setModalName("");
      setModalEmail("");
      setModalPassword("");
      setModalRole("USER");
      setShowAddModal(false);

      // Refresh list
      fetchUsers();
      alert("User account created successfully!");
    } catch (err: unknown) {
      console.error("Create user failed:", err);
      const axiosError = err as { response?: { data?: { message?: string | string[] } } };
      const errMsg = axiosError.response?.data?.message || "Failed to create user. Email may already be registered.";
      setModalError(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/admin" className="hover:text-blue-500 transition-colors flex items-center gap-1">
              Dashboard <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
            <span>/</span>
            <span className="text-white font-medium">User Management</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-500" />
            User Management & Permissions
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Add new users, edit permissions, and manage account statuses across the system.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-md text-sm border border-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* API Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-gray-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#161b22]/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span>Loading users data...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                users
                  // Hide the currently logged-in admin's own row from the table
                  .filter((user) => user.id !== currentUserId)
                  .map((user) => (
                  <tr key={user.id} className="hover:bg-[#1f242c] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                      {user.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ShieldCheck className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          user.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {/* Safeguard: never show action buttons for the logged-in admin's own row */}
                      {user.id === currentUserId ? (
                        <span className="text-xs text-gray-600 italic px-3 py-1">You</span>
                      ) : user.isActive ? (
                        <button
                          onClick={() => handleDeactivate(user.id, user.name)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all"
                        >
                          Disable Account
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.id, user.name)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/10 bg-green-500/5 hover:bg-green-500/10 transition-all"
                        >
                          Enable Account
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <span className="text-sm text-gray-400">
            Showing Page {page} of {totalPages} (Total: {total} users)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-bold text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-bold text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="ltr">
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#30363d] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Create New User</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setModalError("");
                }}
                className="text-gray-400 hover:text-white text-xl leading-none transition-colors focus:outline-none"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Initial Password *
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Role *
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as "ADMIN" | "USER")}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalError("");
                  }}
                  className="flex-1 py-2.5 border border-[#30363d] hover:bg-[#21262d] text-gray-300 rounded-xl transition-all font-semibold text-xs text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold text-xs text-center flex items-center justify-center gap-1 border border-blue-500/20"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
