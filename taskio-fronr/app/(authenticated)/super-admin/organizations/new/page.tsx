"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Building2, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

interface Organization {
  id: number;
  name: string;
  isActive: boolean;
  description?: string;
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!isSlugManuallyEdited) {
      const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      setFormData({ ...formData, name: newName, slug: autoSlug });
    } else {
      setFormData({ ...formData, name: newName });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setFormData({ ...formData, slug: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    
    if (!formData.slug.trim()) {
      toast.error("Organization slug is required");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post(`/organizations`, formData);
      toast.success("Organization created successfully");
      router.push(`/super-admin/organizations/${response.data.id || ''}`);
    } catch (err: any) {
      console.error("Failed to update organization:", err);
      toast.error(err.response?.data?.message || "Failed to create organization");
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link
              href={`/super-admin/organizations`}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Organizations
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            Create Organization
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Add a new organization to the system.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl bg-[#161b22] border border-[#30363d] rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. acme-corporation"
              required
            />
            <p className="text-xs text-gray-500">
              Only lowercase letters, numbers, and hyphens are allowed.
            </p>
          </div>

          <div className="pt-4 border-t border-[#30363d] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/super-admin/organizations`)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-300 bg-[#1f242c] hover:bg-[#30363d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create Organization
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
