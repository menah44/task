"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";

interface Organization {
  id: number;
  name: string;
  isActive: boolean;
  usersCount?: number;
}

interface UserSummary {
  id: number;
  email: string;
  isActive: boolean;
}

export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    setLoadingOrg(true);
    setLoadingUsers(true);

    apiClient
      .get("/organizations")
      .then((response) => {
        const payload = response.data;
        const orgs = payload.data || [];
        setOrganizations(orgs);
      })
      .catch((error) => {
        console.error("Organizations API failed:", error);
        setOrganizations([]);
      })
      .finally(() => setLoadingOrg(false));

    apiClient
      .get("/users")
      .then((response) => {
        const payload = response.data;
        const userArr = payload.data || [];
        setUsers(userArr);
      })
      .catch((error) => {
        console.error("Users API failed:", error);
        setUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const safeOrgs = Array.isArray(organizations) ? organizations : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const totalOrgs = safeOrgs.length;
  const activeOrgs = safeOrgs.filter((o) => o.isActive).length;
  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter((u) => u.isActive).length;

  return (
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Super Admin Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            System-wide overview of organizations and users.
          </p>
        </div>
        <Link
          href="/super-admin/organizations"
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-medium rounded-xl transition-colors">
          Manage Organizations
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <p className="text-muted-foreground text-sm font-medium">Total Organizations</p>
          <h3 className="text-3xl font-bold mt-2 text-foreground">{loadingOrg ? "-" : totalOrgs}</h3>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <p className="text-muted-foreground text-sm font-medium">Active Organizations</p>
          <h3 className="text-3xl font-bold mt-2 text-success">{loadingOrg ? "-" : activeOrgs}</h3>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <p className="text-muted-foreground text-sm font-medium">Total Users</p>
          <h3 className="text-3xl font-bold mt-2 text-primary">{loadingUsers ? "-" : totalUsers}</h3>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <p className="text-muted-foreground text-sm font-medium">Active Users</p>
          <h3 className="text-3xl font-bold mt-2 text-success">{loadingUsers ? "-" : activeUsers}</h3>
        </div>
      </div>

      {/* Recent Organizations Section */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
        <h3 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-3">
          Organizations Overview
        </h3>

        {loadingOrg ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : safeOrgs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {safeOrgs.map((org) => (
              <div
                key={org.id}
                className="border border-border rounded-2xl p-5 hover:border-blue-500/50 hover:bg-muted transition-all bg-background flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <Link
                      href={`/super-admin/organizations/${org.id}`}
                      className="font-semibold text-lg text-foreground hover:text-primary/80 transition-colors cursor-pointer">
                      {org.name}
                    </Link>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        org.isActive
                          ? "bg-success text-success-foreground border-transparent shadow-sm"
                          : "bg-accent text-accent-foreground border-transparent shadow-sm"
                      }`}>
                      {org.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm mt-3">
                    Users:{" "}
                    <span className="text-foreground font-medium">
                      {org.usersCount || 0}
                    </span>{" "}
                    registered
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 flex justify-end gap-4 flex-wrap">
                  <Link
                    href={`/super-admin/organizations/${org.id}`}
                    className="text-primary font-medium text-sm hover:text-primary/80 transition-colors">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
