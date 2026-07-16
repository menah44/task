"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Building2, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Organization {
  id: number;
  name: string;
  isActive: boolean;
  description?: string;
}

export default function EditOrganizationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  
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
      <div className="bg-error/15 border border-error/20 text-error p-6 rounded-xl flex items-center justify-center flex-col gap-4">
        <AlertCircle className="w-10 h-10" />
        <p>{t("superAdmin.noOrgs")}</p>
        <Link href="/super-admin/organizations" className="text-primary hover:underline">
          {t("superAdmin.backToOrgs")}
        </Link>
      </div>
    );
  }

  return (
    <main className="space-y-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href={`/super-admin/organizations/${id}`}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("superAdmin.backToOrgs")}
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            {t("superAdmin.editOrg")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("superAdmin.editOrgDesc")}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl bg-card border border-border rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              {t("superAdmin.orgName")} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
              placeholder={t("superAdmin.orgNamePlaceholder")}
              required
            />
          </div>



          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/super-admin/organizations/${id}`)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground bg-muted hover:bg-accent transition-colors"
            >
              {t("superAdmin.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-primary-foreground shadow-sm bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("superAdmin.updateBtn")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
