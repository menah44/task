"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList, ExternalLink, Play, ShieldAlert, BarChart3, Trash } from "lucide-react";

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

const fetchStudioForms = async (): Promise<FormItem[]> => {
  try {
    const response = await fetch("/api/accessible-forms");
    if (response.ok) {
      return await response.json();
    }
  } catch {
    console.log("Backend API not connected yet, using fallback data.");
  }

  return [
    {
      id: "form-101",
      title: "Customer Feedback Survey",
      status: "published",
      updatedAt: "2026-06-28T12:00:00.000Z",
      permissions: { canEdit: true, canView: true, canDelete: true },
    },
    {
      id: "form-102",
      title: "Job Application Form",
      status: "draft",
      updatedAt: "2026-06-25T09:30:00.000Z",
      permissions: { canEdit: true, canView: true, canDelete: false },
    },
    {
      id: "form-103",
      title: "Course Evaluation Quiz",
      status: "archived",
      updatedAt: "2026-06-20T15:45:00.000Z",
      permissions: { canEdit: false, canView: true, canDelete: false },
    },
  ];
};

export default function StudioFormsPage() {
  const { data: forms, isLoading } = useQuery<FormItem[]>({
    queryKey: ["accessible-forms"],
    queryFn: fetchStudioForms,
    staleTime: 60 * 1000,
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
                          form.status === "published"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : form.status === "draft"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {form.status}
                      </span>
                    </td>

                    {/* Updated Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {new Date(form.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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

                      <button
                        onClick={() => alert(`Publishing form: ${form.id}`)}
                        className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Publish
                      </button>

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
                        disabled={!form.permissions?.canDelete}
                        onClick={() => alert(`Deleting form: ${form.id}`)}
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
