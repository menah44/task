"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList, ExternalLink, Play, Square, ShieldAlert, BarChart3, Trash } from "lucide-react";

interface FormPermissions {
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
}

interface FormItem {
  id: string | number;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  permissions: FormPermissions;
}

import apiClient from "@/lib/api/client";

const fetchStudioForms = async (): Promise<FormItem[]> => {
  try {
    const response = await apiClient.get("/forms");
    return response.data.items || [];
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    return [];
  }
};

export default function StudioFormsPage() {
  const { data: forms, isLoading } = useQuery<FormItem[]>({
    queryKey: ["accessible-forms"],
    queryFn: fetchStudioForms,
    staleTime: 60 * 1000,
  });

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      await apiClient.patch(`/forms/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessible-forms"] });
    },
    onError: (err) => {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessible-forms"] });
    },
    onError: (err) => {
      console.error("Failed to delete form", err);
      alert("Failed to delete form.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#c9d1d9]" dir="ltr">
      <div className="flex justify-between items-center border-b border-[#30363d] pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Studio Forms
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your created forms, check statuses, and open response builders.
          </p>
        </div>
        <Link
          href="/studio/forms/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md border border-blue-500/20"
        >
          + Create New Form
        </Link>
      </div>

      <div className="bg-[#161b22] rounded-3xl border border-[#30363d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#30363d] text-left text-sm">
            <thead className="bg-[#161b22]/50 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-sm text-gray-300">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <tr
                    key={form.id}
                    className="hover:bg-[#1f242c] transition-colors"
                  >
                    {/* Title */}
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                      {form.title}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          form.status?.toUpperCase() === "PUBLISHED"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : form.status?.toUpperCase() === "DRAFT"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {form.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) : "N/A"}
                    </td>

                    {/* Permissions Icons */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 text-sm">
                        {form.permissions?.canEdit && (
                          <span title="Can Edit" className="text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 text-[10px] font-bold">EDIT</span>
                        )}
                        {form.permissions?.canView && (
                          <span title="Can View" className="text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 text-[10px] font-bold">VIEW</span>
                        )}
                        {form.permissions?.canDelete && (
                          <span title="Can Delete" className="text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 text-[10px] font-bold">DELETE</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-3">
                      <Link
                        href={`/studio/forms/${form.id}/builder`}
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Builder
                      </Link>

                      {form.status?.toUpperCase() !== "PUBLISHED" ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: form.id, status: "PUBLISHED" })}
                          disabled={statusMutation.isPending}
                          className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" /> Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: form.id, status: "DRAFT" })}
                          disabled={statusMutation.isPending}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50"
                        >
                          <Square className="w-3.5 h-3.5" /> Unpublish
                        </button>
                      )}

                      <Link
                        href={`/studio/forms/${form.id}/permissions`}
                        className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Security
                      </Link>

                      <Link
                        href={`/studio/forms/${form.id}/analytics`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Analytics
                      </Link>

                      <button
                        disabled={!form.permissions?.canDelete || deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
                            deleteMutation.mutate(form.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer ${
                          form.permissions?.canDelete
                            ? "text-red-400 hover:text-red-300"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <Trash className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No permitted forms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
