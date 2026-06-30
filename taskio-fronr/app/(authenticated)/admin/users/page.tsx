"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, ArrowRight, ShieldCheck, Mail, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

interface UserItem {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedDate?: string;
}

export default function UserManagementPage() {
  const router = useRouter();
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

  

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link
              href="/admin"
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
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
            Add new users, edit permissions, and manage account statuses across
            the system.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/users/new")}
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
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span>Loading users data...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                users
                  // Hide the currently logged-in admin's own row from the table
                  .filter((user) => user.id !== currentUserId)
                  .map((user) => {
                    const displayName =
                      user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName
                        ? user.firstName
                        : user.username || "N/A";

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-[#1f242c] transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                          {displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === "ADMIN" 
                              ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {user.role === "ADMIN" ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />} {user.role || "N/A"}
                          </span>
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
                            >
                              View Details
                            </button>
                            {/* Safeguard: never show action buttons for the logged-in admin's own row */}
                            {user.id === currentUserId ? (
                              <span className="text-xs text-gray-600 italic px-3 py-1">
                                You
                              </span>
                            ) : user.isActive ? (
                              <button
                                onClick={() => handleDeactivate(user.id, displayName)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all"
                              >
                                Disable Account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(user.id, displayName)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/10 bg-green-500/5 hover:bg-green-500/10 transition-all"
                              >
                                Enable Account
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

     
    </main>
  );
}

