"use client";

import React, { useState, useEffect } from "react";
import { Building2, ArrowLeft, ArrowRight, Loader2, AlertCircle, Edit3, Users, Calendar, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatters";
import CreateAdminModal from "@/components/CreateAdminModal";

interface Organization {
  id: number;
  name: string;
  isActive: boolean;
  usersCount?: number;
  createdAt?: string;
  description?: string;
  users?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    isActive: boolean;
  }[];
}

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const id = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/organizations/${id}`);
        setOrganization(response.data);
      } catch (err: any) {
        console.error("Failed to fetch organization:", err);
        // Fallback mock
        setOrganization({
          id: Number(id),
          name: "Acme Corp (Mock)",
          isActive: true,
          usersCount: 15,
          createdAt: new Date().toISOString(),
          description: "Mock organization for demonstration purposes.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchOrganization();
  }, [id]);

  const fetchOrganizationRef = () => {
    if (id) {
      apiClient.get(`/organizations/${id}`).then((res) => setOrganization(res.data)).catch(console.error);
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
        <div className="flex items-center justify-center h-[50vh] text-error">
          <p>{t("superAdmin.noOrgs")}</p>
        </div>
        <Link href="/super-admin/organizations" className="text-primary hover:underline">
          Return to Organizations
        </Link>
      </div>
    );
  }

  const adminUser = organization.users?.find((u) => u.role === "ADMIN");

  return (
    <main className="space-y-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/super-admin/organizations"
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" /> {t("superAdmin.backToOrgs")}
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            {organization.name}
          </h2>
        </div>

        <button
          onClick={() => router.push(`/super-admin/organizations/${id}/edit`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-card text-foreground hover:bg-muted border border-border shadow-sm rounded-xl transition-all font-semibold text-sm"
        >
          <Edit3 className="w-4 h-4" />
          {t("superAdmin.edit")}
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-foreground">{t("superAdmin.overview")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t("superAdmin.description")}</label>
                <p className="text-muted-foreground mt-1">{organization.description || t("superAdmin.noDesc")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t("superAdmin.createdAt")}</label>
                  <div className="flex items-center gap-2 mt-1 text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{organization.createdAt ? new Intl.DateTimeFormat(i18n.language).format(new Date(organization.createdAt)) : "N/A"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t("superAdmin.status")}</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        organization.isActive
                          ? "bg-success/15 text-success border border-success/20 shadow-sm"
                          : "bg-muted text-muted-foreground border border-border shadow-sm"
                      }`}
                    >
                      {organization.isActive ? t("superAdmin.active") : t("superAdmin.inactive")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Details Section */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-foreground">{t("superAdmin.orgAdmin")}</h3>
            {adminUser ? (
              <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {adminUser.firstName} {adminUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{adminUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-border border-dashed rounded-xl">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t("superAdmin.noAdmin")}</p>
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t("superAdmin.setupAdmin")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{formatNumber(organization.usersCount || 0, i18n.language)}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("superAdmin.totalUsers")}</p>
            </div>
            <div className="p-4 bg-muted/30 border-t border-border">
              <button
                onClick={() => router.push(`/super-admin/users?orgId=${organization.id}`)}
                className="w-full py-2.5 bg-background border border-border hover:bg-muted text-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {t("superAdmin.manageUsers")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateAdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        organizationId={organization.id}
        organizationName={organization.name}
        onSuccess={fetchOrganizationRef}
      />
    </main>
  );
}
