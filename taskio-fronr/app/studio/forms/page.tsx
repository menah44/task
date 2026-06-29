"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
  } catch (_) {
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Forms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your forms and check deployment criteria.
          </p>
        </div>
        {/* ✅ زرار Create New Form */}
        <Link
          href="/studio/forms/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          + Create New Form
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <tr
                    key={form.id}
                    className="hover:bg-gray-50 transition-colors">
                    {/* Title */}
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {form.title}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          form.status === "published"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : form.status === "draft"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}>
                        {form.status}
                      </span>
                    </td>

                    {/* Updated Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(form.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Permissions Icons */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 text-base">
                        {form.permissions?.canEdit && (
                          <span title="Can Edit">✏️</span>
                        )}
                        {form.permissions?.canView && (
                          <span title="Can View">👁️</span>
                        )}
                        {form.permissions?.canDelete && (
                          <span title="Can Delete">🗑️</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/studio/forms/${form.id}/builder`}
                        className="text-blue-600 hover:text-blue-900 transition-colors">
                        Open builder
                      </Link>

                      <button
                        onClick={() => alert(`Publishing form: ${form.id}`)}
                        className="text-green-600 hover:text-green-900 transition-colors">
                        Publish
                      </button>

                      <Link
                        href={`/studio/forms/${form.id}/permissions`}
                        className="text-purple-600 hover:text-purple-900 transition-colors">
                        Permissions
                      </Link>

                      <Link
                        href={`/studio/forms/${form.id}/analytics`}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors">
                        Analytics
                      </Link>

                      <button
                        disabled={!form.permissions?.canDelete}
                        onClick={() => alert(`Deleting form: ${form.id}`)}
                        className={`transition-colors ${
                          form.permissions?.canDelete
                            ? "text-red-600 hover:text-red-900"
                            : "text-gray-300 cursor-not-allowed"
                        }`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500">
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
