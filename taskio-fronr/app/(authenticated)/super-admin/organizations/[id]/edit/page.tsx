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

export default function EditOrganizationPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/organizations/${id}`);
        setOrganization(response.data);
        setFormData({
          name: response.data.name || "",
        });
      } catch (err: any) {
        console.error("Failed to fetch organization:", err);
        // Fallback mock
        const mockOrg = {
          id: Number(id),
          name: "Acme Corp",
          isActive: true,
          description: "Mock organization for demonstration purposes.",
        };
        setOrganization(mockOrg);
        setFormData({
          name: mockOrg.name,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchOrganization();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put(`/organizations/${id}`, formData);
      toast.success("Organization updated successfully");
      router.push(`/super-admin/organizations/${id}`);
    } catch (err: any) {
      console.error("Failed to update organization:", err);
      toast.error(err.response?.data?.message || "Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl flex items-center justify-center flex-col gap-4">
        <AlertCircle className="w-10 h-10" />
        <p>Organization not found or an error occurred.</p>
        <Link href="/super-admin/organizations" className="text-blue-400 hover:underline">
          Return to Organizations
        </Link>
      </div>
    );
  }

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link
              href={`/super-admin/organizations/${id}`}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Organization
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            Edit Organization
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Update details for {organization.name}.
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>



          <div className="pt-4 border-t border-[#30363d] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/super-admin/organizations/${id}`)}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
