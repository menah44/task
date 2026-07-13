"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ArrowRight, Building2, PlusCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateAdminModal from "@/components/CreateAdminModal";

interface Organization {
  id: number;
  name: string;
  slug?: string;
  isActive: boolean;
  usersCount?: number;
  createdAt?: string;
}

export default function OrganizationsManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState("");

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

  const limit = 5;

  // Search Debounce Effect
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

  // Fetch Organizations
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/organizations", {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      const payload = response.data;
      const orgs = payload.data || [];
      
      setOrganizations(orgs);
      setTotal(payload.total || 0);
      setTotalPages(payload.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load organizations:", err);
      setError("Failed to load organizations.");
      setOrganizations([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Deactivate Organization Handler
  const handleDeactivate = async (id: number, name: string) => {
    triggerConfirm(
      "Deactivate Organization",
      `Are you sure you want to deactivate ${name}? Users in this organization will no longer be able to log in.`,
      async () => {
        try {
          await apiClient.patch(`/organizations/${id}/deactivate`);
          toast.success("Organization deactivated successfully");
          fetchOrganizations();
        } catch (err: unknown) {
          console.error("Deactivation failed:", err);
          toast.error("Failed to deactivate organization.");
        }
      }
    );
  };

  // Activate Organization Handler
  const handleActivate = async (id: number, name: string) => {
    triggerConfirm(
      "Activate Organization",
      `Are you sure you want to enable ${name}? Users in this organization will be able to log in again.`,
      async () => {
        try {
          await apiClient.patch(`/organizations/${id}/activate`);
          toast.success("Organization activated successfully");
          fetchOrganizations();
        } catch (err: unknown) {
          console.error("Activation failed:", err);
          toast.error("Failed to enable organization.");
        }
      }
    );
  };

  const safeOrgs = Array.isArray(organizations) ? organizations : [];

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/super-admin/dashboard"
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              Dashboard <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Organizations</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            Organizations Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            View, edit, and manage organizations across the system.
          </p>
        </div>

        <button
          onClick={() => router.push("/super-admin/organizations/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl transition-all font-semibold shadow-md text-sm border border-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          Add Organization
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
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-foreground text-sm focus:outline-none w-full placeholder-gray-500"
        />
      </div>

      {/* Organizations Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/50 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {safeOrgs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No organizations found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  safeOrgs.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-muted transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                        {org.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {org.slug || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {org.usersCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            org.isActive
                              ? "bg-success/15 text-success border-success/20"
                              : "bg-muted0/10 text-muted-foreground border-gray-500/20"
                          }`}
                        >
                          {org.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrgId(org.id);
                              setSelectedOrgName(org.name);
                              setAdminModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all"
                          >
                            Create Admin
                          </button>
                          {org.isActive ? (
                            <button
                              onClick={() => handleDeactivate(org.id, org.name)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-error border border-red-500/10 bg-red-500/5 hover:bg-error/15 transition-all"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(org.id, org.name)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-success border border-green-500/10 bg-green-500/5 hover:bg-success/15 transition-all"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
            Showing Page {page} of {totalPages} (Total: {total} organizations)
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

      {selectedOrgId && (
        <CreateAdminModal
          isOpen={adminModalOpen}
          onClose={() => {
            setAdminModalOpen(false);
            setSelectedOrgId(null);
            setSelectedOrgName("");
          }}
          organizationId={selectedOrgId}
          organizationName={selectedOrgName}
          onSuccess={fetchOrganizations}
        />
      )}
    </main>
  );
}
