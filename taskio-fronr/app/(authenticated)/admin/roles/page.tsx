"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatters";

interface Role {
  id: number;
  name: string;
  usersCount?: number;
}

export default function RolesPage() {
  const { t, i18n } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/roles');
      setRoles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t("adminRoles.failedLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    setAddLoading(true);
    setAddError(null);
    try {
      await apiClient.post('/roles', { name: newRoleName });
      setIsAddModalOpen(false);
      setNewRoleName("");
      await fetchRoles();
    } catch (err: any) {
      setAddError(err.response?.data?.message || t("adminRoles.failedAdd"));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    triggerConfirm(
      t("adminRoles.deleteTitle"),
      t("adminRoles.deleteDesc", { roleName }),
      async () => {
        setLoading(true);
        setError(null);
        try {
          await apiClient.delete(`/roles/${roleId}`);
          toast.success(t("adminRoles.deleteSuccess"));
          await fetchRoles();
        } catch (err: any) {
          toast.error(err.response?.data?.message || t("adminRoles.failedDelete"));
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleEditRole = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editRoleName.trim() || editRoleId === null) return;
    
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.put(`/roles/${editRoleId}`, { name: editRoleName.trim() });
      setEditRoleName("");
      setEditRoleId(null);
      await fetchRoles();
    } catch (err: any) {
      setEditError(err.response?.data?.message || t("adminRoles.failedUpdate"));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t("adminRoles.title")}</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm rounded-xl text-sm font-medium transition-colors"
          >
            {t("adminRoles.addRole")}
          </button>
        </div>
        
        {loading && <SkeletonTable />}

        {error && (
          <div className="bg-error/15 border border-error/20 text-error p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-lg font-semibold text-foreground">{t("adminRoles.allRoles")}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    <th className="p-4 py-3 ltr:text-start rtl:text-end">{t("adminRoles.roleName")}</th>
                    <th className="p-4 py-3 ltr:text-start rtl:text-end">{t("adminRoles.usersCount")}</th>
                    <th className="p-4 py-3 ltr:text-end rtl:text-start">{t("adminRoles.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm text-muted-foreground">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        {t("adminRoles.noRoles")}
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="hover:bg-muted/50 transition-colors">
                        {editRoleId === role.id ? (
                          <>
                            <td className="p-4 font-medium text-foreground">
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleEditRole(e);
                                }}
                                className="flex flex-col gap-1 w-full"
                              >
                                <input
                                  type="text"
                                  value={editRoleName}
                                  onChange={(e) => setEditRoleName(e.target.value)}
                                  placeholder={t("adminRoles.roleNamePlaceholder")}
                                  className="w-full bg-background border border-blue-500 rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:border-blue-400 transition-colors uppercase sm:max-w-xs"
                                  required
                                  disabled={editLoading}
                                  autoFocus
                                />
                                {editError && (
                                  <span className="text-xs text-error">{editError}</span>
                                )}
                              </form>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {formatNumber(role.usersCount ?? 0, i18n.language)} {(role.usersCount ?? 0) === 1 ? t("adminRoles.user") : t("adminRoles.users")}
                            </td>
                            <td className="p-4 ltr:text-end rtl:text-start">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => handleEditRole()}
                                  disabled={editLoading || !editRoleName.trim() || editRoleName.toUpperCase() === role.name.toUpperCase()}
                                  className="text-success hover:text-green-300 font-medium transition-colors disabled:opacity-50"
                                >
                                  {editLoading ? t("adminRoles.saving") : t("adminRoles.save")}
                                </button>
                                <button 
                                  onClick={() => setEditRoleId(null)}
                                  disabled={editLoading}
                                  className="text-muted-foreground hover:text-muted-foreground font-medium transition-colors"
                                >
                                  {t("adminRoles.cancel")}
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-medium text-foreground">
                              {role.name}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {formatNumber(role.usersCount ?? 0, i18n.language)} {(role.usersCount ?? 0) === 1 ? t("adminRoles.user") : t("adminRoles.users")}
                            </td>
                            <td className="p-4 ltr:text-end rtl:text-start">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => {
                                    setEditRoleId(role.id);
                                    setEditRoleName(role.name);
                                    setEditError(null);
                                  }}
                                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                  {t("adminRoles.edit")}
                                </button>
                                <button 
                                  onClick={() => handleDeleteRole(role.id, role.name)}
                                  className="text-error hover:text-red-300 font-medium transition-colors"
                                >
                                  {t("adminRoles.delete")}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl w-full max-w-md border border-border overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-xl font-bold text-foreground">{t("adminRoles.addNewRole")}</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {addError && (
                <div className="mb-4 p-4 rounded-xl bg-error/15 border border-error/20 text-error text-sm">
                  {addError}
                </div>
              )}
              <form id="addRoleForm" onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t("adminRoles.roleNameLabel")}</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder={t("adminRoles.roleNamePlaceholder")}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors uppercase"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-card">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {t("adminRoles.cancel")}
              </button>
              <button
                type="submit"
                form="addRoleForm"
                disabled={addLoading || !newRoleName.trim()}
                className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addLoading && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                )}
                {t("adminRoles.save")}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Edit Modal has been refactored to inline edit rows */}
    </main>
  );
}
