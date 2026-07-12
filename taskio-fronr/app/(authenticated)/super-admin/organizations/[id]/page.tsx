"use client";

import React, { useState, useEffect } from "react";
import { Building2, ArrowLeft, Loader2, AlertCircle, Edit, Users, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
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
  const { id } = useParams();
  const router = useRouter();
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
        <AlertCircle className="w-10 h-10" />
        <p>Organization not found or an error occurred.</p>
        <Link href="/super-admin/organizations" className="text-primary hover:underline">
          Return to Organizations
        </Link>
      </div>
    );
  }

  const adminUser = organization.users?.find((u) => u.role === "ADMIN");

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/super-admin/organizations"
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Organizations
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            {organization.name}
          </h2>
        </div>

        <button
          onClick={() => router.push(`/super-admin/organizations/${id}/edit`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-accent border border-border text-foreground rounded-xl transition-all font-semibold shadow-md text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit Organization
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-foreground">Overview</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Description</label>
                <p className="text-muted-foreground mt-1">{organization.description || "No description provided."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Created At</label>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        organization.isActive
                          ? "bg-success text-success-foreground border-transparent shadow-sm"
                          : "bg-accent text-accent-foreground border-transparent shadow-sm"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {organization.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Details Section */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-foreground">Organization Admin</h3>
            {adminUser ? (
              <div className="bg-background border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {adminUser.firstName} {adminUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{adminUser.email}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    adminUser.isActive
                      ? "bg-success text-success-foreground border-transparent shadow-sm"
                      : "bg-accent text-accent-foreground border-transparent shadow-sm"
                  }`}
                >
                  {adminUser.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ) : (
              <div className="bg-background border border-border p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">No Admin assigned</p>
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-foreground text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Create Admin
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">{organization.usersCount || 0}</h3>
            <p className="text-muted-foreground text-sm mt-1">Total Users</p>
            
            <button
              onClick={() => router.push(`/super-admin/users?orgId=${organization.id}`)}
              className="mt-6 w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl transition-all font-semibold text-sm"
            >
              View Users
            </button>
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
