"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, ArrowRight, ShieldCheck, Mail, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import ConfirmDialog from "@/components/ConfirmDialog";

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

  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({ title, description, onConfirm });
    setConfirmOpen(true);
  };

 
  

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
      const payload = response.data;
      const userArr = payload.items || payload.data || [];
      // Filter out the current logged-in admin from the list (frontend safeguard)
      // Note: total/totalPages reflect server counts — acceptable trade-off vs. server-side change
      setUsers(userArr);
      setTotal(payload.total || 0);
      setTotalPages(payload.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load users:", err);
      setError("Failed to retrieve users list from the server.");
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 3. User Deactivation Handler
  const handleDeactivate = async (id: number, name: string) => {
    triggerConfirm(
      "Deactivate User",
      `Are you sure you want to deactivate ${name}'s account? This user will no longer be able to log in.`,
      async () => {
        try {
          await apiClient.patch(`/users/${id}/deactivate`);
          toast.success("Account deactivated successfully");
          fetchUsers(); // Refresh the list
        } catch (err: unknown) {
          console.error("Deactivation failed:", err);
          toast.error("Failed to deactivate account.");
        }
      }
    );
  };

  // 3b. User Activation Handler
  const handleActivate = async (id: number, name: string) => {
    triggerConfirm(
      "Activate User",
      `Are you sure you want to enable ${name}'s account? This user will be able to log in again.`,
      async () => {
        try {
          await apiClient.patch(`/users/${id}/activate`);
          toast.success("Account activated successfully");
          fetchUsers(); // Refresh the list
        } catch (err: unknown) {
          console.error("Activation failed:", err);
          toast.error("Failed to enable account.");
        }
      }
    );
  };

  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/super-admin"
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              Dashboard <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">User Management</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-500" />
            User Management & Permissions
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Add new users, edit permissions, and manage account statuses across
            the system.
          </p>
        </div>

        <button
          onClick={() => router.push("/super-admin/users/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl transition-all font-semibold shadow-md text-sm border border-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* API Error Alert */}
      {error && (
        <div className="bg-error/15 border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-foreground text-sm focus:outline-none w-full placeholder-gray-500"
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/50 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {safeUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No users found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                safeUsers
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
                        className="hover:bg-muted transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                          {displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            user.role?.toUpperCase() === "SUPER_ADMIN" 
                              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                              : user.role?.toUpperCase() === "ADMIN" 
                                ? "bg-error/10 text-error border border-error/20 shadow-sm"
                                : user.role?.toUpperCase() === "MANAGER" || user.role?.toUpperCase() === "MANGER"
                                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                  : user.role?.toUpperCase() === "EMPLOYEE" || user.role?.toUpperCase() === "EMPLOYE"
                                    ? "bg-success/10 text-success border border-success/20 shadow-sm"
                                    : "bg-muted text-muted-foreground border border-border shadow-sm"
                          }`}>
                            {user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "SUPER_ADMIN" ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />} {user.role || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              user.isActive
                                ? "bg-success/15 text-success border-success/20"
                                : "bg-muted0/10 text-muted-foreground border-gray-500/20"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/super-admin/users/${user.id}`)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
                            >
                              View Details
                            </button>
                            {/* Safeguard: never show action buttons for the logged-in admin's own row */}
                            {user.id === currentUserId ? (
                              <span className="text-xs text-muted-foreground italic px-3 py-1">
                                You
                              </span>
                            ) : user.isActive ? (
                              <button
                                onClick={() => handleDeactivate(user.id, displayName)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-error border border-red-500/10 bg-red-500/5 hover:bg-error/15 transition-all"
                              >
                                Disable Account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(user.id, displayName)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-success border border-green-500/10 bg-green-500/5 hover:bg-success/15 transition-all"
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
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-4">
          <span className="text-sm text-muted-foreground">
            Showing Page {page} of {totalPages} (Total: {total} users)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-background border border-border rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-background border border-border rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}

