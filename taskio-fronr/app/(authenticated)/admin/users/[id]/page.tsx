"use client";
import { isElevatedRole } from "@/lib/auth-utils";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import SkeletonCard from "@/components/SkeletonCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";

interface UserDetail {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userGroups, setUserGroups] = useState<{ id: number; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("Profile");
  const [addRoleLoading, setAddRoleLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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

  // Form states
  const [editFormData, setEditFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editApiError, setEditApiError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/users/${params.id}`);
      setUser(res.data);
      setEditFormData({
        email: res.data.email || "",
        username: res.data.username || "",
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
      });
      setSelectedRole(res.data.role || "");
      setIsDirty(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t("userDetails.errorNotFound"));
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError(t("userDetails.errorUnauthorized"));
      } else {
        setError(t("userDetails.errorServer"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  useEffect(() => {
    if (activeTab === "Roles") {
      const fetchAllRoles = async () => {
        try {
          const res = await apiClient.get('/roles');
          setRoles(res.data);
          if (user) {
            setSelectedRole(user.role || "");
          }
        } catch (err) {
          console.error("Failed to fetch roles", err);
        }
      };

      fetchAllRoles();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "Groups") {
      const fetchUserGroups = async () => {
        try {
          const res = await apiClient.get(`/users/${params.id}/groups`);
          setUserGroups(res.data);
        } catch (err) {
          console.error("Failed to fetch user groups", err);
        }
      };
      fetchUserGroups();
    }
  }, [activeTab, params.id]);

  const hasUnsavedChanges = isDirty || (selectedRole !== "" && selectedRole !== (user?.role || ""));

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t("userDetails.unsavedDesc");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleRoleChangeSubmit = async () => {
    if (!selectedRole) return;
    setAddRoleLoading(true);
    try {
      await apiClient.put(`/users/${params.id}`, { role: selectedRole });
      await fetchUser();
      router.refresh();
      toast.success(t("userDetails.successRole"));
    } catch (err: any) {
      console.error("Failed to update role", err);
      toast.error(err.response?.data?.message || t("userDetails.errorServer"));
    } finally {
      setAddRoleLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const endpoint = user.isActive 
        ? `/users/${user.id}/deactivate` 
        : `/users/${user.id}/activate`;
        
      await apiClient.patch(endpoint);
      
      toast.success(`User account ${user.isActive ? "disabled" : "enabled"} successfully`);
      await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };


  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (editErrors[name]) {
      setEditErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditApiError(null);
    setEditErrors({});
    setEditLoading(true);

    try {
      await apiClient.put(`/users/${params.id}`, editFormData);
      toast.success(t("userDetails.successUpdate"));
      setIsDirty(false);
      await fetchUser();
    } catch (err: any) {
      if (err.response?.status === 409) {
        const msg = err.response.data?.message;
        if (msg?.includes("Username")) setEditErrors({ username: msg });
        else if (msg?.includes("Email")) setEditErrors({ email: msg });
        else setEditApiError(msg || t("userDetails.conflict"));
      } else if (err.response?.status === 422 || err.response?.status === 400) {
        const errors = err.response.data?.errors || err.response.data?.message;
        if (typeof errors === 'object' && !Array.isArray(errors) && errors !== null) {
          const newErrors: Record<string, string> = {};
          for (const key in errors) {
            newErrors[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
          }
          setEditErrors(newErrors);
        } else if (Array.isArray(errors)) {
           const newErrors: Record<string, string> = {};
           errors.forEach((msg: string) => {
             const field = msg.split(' ')[0];
             newErrors[field] = msg;
           });
           setEditErrors(newErrors);
        } else {
          setEditApiError(err.response.data?.message || t("userDetails.validationFailed"));
        }
      } else if (err.response?.status === 404) {
        setEditApiError(t("userDetails.errorNotFound"));
      } else {
        setEditApiError(t("userDetails.unexpectedError"));
      }
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <SkeletonCard />
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  triggerConfirm(
                    t("userDetails.unsavedTitle"),
                    t("userDetails.unsavedDesc"),
                    () => router.push('/admin/users')
                  );
                } else {
                  router.push('/admin/users');
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2"
            >
              {t("userDetails.back")}
            </button>
          </div>
          <div className="bg-error/15 border border-error/20 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-error mb-2">{t("userDetails.errorGeneric")}</h2>
            <p className="text-muted-foreground">{error || t("userDetails.errorNotFound")}</p>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  triggerConfirm(
                    t("userDetails.unsavedTitle"),
                    t("userDetails.unsavedDesc"),
                    () => router.push('/admin/users')
                  );
                } else {
                  router.push('/admin/users');
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2 mb-4"
            >
              {t("userDetails.back")}
            </button>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {t("userDetails.title")}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border ${
                user.isActive 
                  ? "bg-error/10 hover:bg-error/20 text-error border-error/20" 
                  : "bg-success/10 hover:bg-success/20 text-success border-success/20"
              } disabled:opacity-50`}
            >
              {actionLoading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              )}
              {user.isActive ? t("userDetails.disableAccount") : t("userDetails.enableAccount")}
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6">
          {["Profile", "Roles", "Groups"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (hasUnsavedChanges) {
                  triggerConfirm(
                    t("userDetails.unsavedTitle"),
                    t("userDetails.unsavedDesc"),
                    () => {
                      if (user) {
                        setEditFormData({
                          email: user.email || "",
                          username: user.username || "",
                          firstName: user.firstName || "",
                          lastName: user.lastName || "",
                        });
                        setSelectedRole(user.role || "");
                      }
                      setIsDirty(false);
                      setActiveTab(tab);
                    }
                  );
                } else {
                  setActiveTab(tab);
                }
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab === "Profile" ? t("userDetails.tabs.profile") : tab === "Roles" ? t("userDetails.tabs.roles") : t("userDetails.tabs.groups")}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-foreground">{t("userDetails.editProfile")}</h3>
              </div>
              
              {editApiError && (
                <div className="mb-6 p-4 rounded-xl bg-error/15 border border-error/20 text-error text-sm">
                  {editApiError}
                </div>
              )}

              <form id="editUserForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t("userDetails.firstName")}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      className={`w-full bg-background border ${editErrors.firstName ? "border-red-500" : "border-border"} rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors`}
                    />
                    {editErrors.firstName && <p className="mt-1 text-sm text-error">{editErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t("userDetails.lastName")}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditChange}
                      className={`w-full bg-background border ${editErrors.lastName ? "border-red-500" : "border-border"} rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors`}
                    />
                    {editErrors.lastName && <p className="mt-1 text-sm text-error">{editErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t("userDetails.username")}</label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditChange}
                    className={`w-full bg-background border ${editErrors.username ? "border-red-500" : "border-border"} rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors`}
                  />
                  {editErrors.username && <p className="mt-1 text-sm text-error">{editErrors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t("userDetails.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className={`w-full bg-background border ${editErrors.email ? "border-red-500" : "border-border"} rounded-xl px-4 py-3 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors`}
                  />
                  {editErrors.email && <p className="mt-1 text-sm text-error">{editErrors.email}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {editLoading && (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {t("userDetails.saveChanges")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "Roles" && (
          <div className="bg-card rounded-3xl shadow-sm border border-border p-6 sm:p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">{t("userDetails.userRole")}</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {user.role ? (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                  user.role.toUpperCase() === "ADMIN"
                    ? "bg-error/15 text-error border-error/20"
                    : !isElevatedRole(user.role)
                    ? "bg-blue-500/10 text-primary border-blue-500/20"
                    : "bg-muted0/10 text-muted-foreground border-gray-500/20"
                }`}>
                  {user.role}
                </span>
              ) : (
                <p className="text-muted-foreground text-sm">{t("userDetails.noRole")}</p>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{t("userDetails.changeRole")}</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors flex-1 w-full sm:max-w-xs appearance-none"
                >
                  <option value="">{t("userDetails.selectRole")}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleRoleChangeSubmit}
                  disabled={!selectedRole || addRoleLoading || selectedRole === user.role}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {addRoleLoading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {t("userDetails.saveRole")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Groups" && (
          <div className="bg-card rounded-3xl shadow-sm border border-border p-6 sm:p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">{t("userDetails.userGroups")}</h3>
            {userGroups.length === 0 ? (
              <div className="text-center py-8 bg-background rounded-xl border border-border border-dashed">
                <p className="text-muted-foreground text-sm">{t("userDetails.noGroups")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userGroups.map(group => (
                  <div key={group.id} className="bg-background border border-border rounded-xl p-4 flex items-center justify-between">
                    <span className="text-foreground font-medium">{group.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </main>
  );
}
