"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";

interface Role {
  id: number;
  name: string;
  usersCount?: number;
}

export default function RolesPage() {
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

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/roles');
      setRoles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load roles");
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
      setAddError(err.response?.data?.message || "Failed to add role");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role ${roleName}?`)) return;
    try {
      await apiClient.delete(`/roles/${roleId}`);
      await fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete role");
    }
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
      setEditError(err.response?.data?.message || "Failed to update role");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Roles Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Add Role
          </button>
        </div>
        
        {loading && (
          <div className="animate-pulse">
            <div className="h-4 bg-[#30363d] rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-[#30363d] rounded w-full"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]">
              <h2 className="text-lg font-semibold text-white">All Roles</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#21262d] border-b border-[#30363d] text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <th className="p-4 py-3">Role Name</th>
                    <th className="p-4 py-3">Users Count</th>
                    <th className="p-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d] text-sm text-gray-300">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        No roles found.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="hover:bg-[#21262d]/50 transition-colors">
                        {editRoleId === role.id ? (
                          <>
                            <td className="p-4 font-medium text-gray-200">
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
                                  placeholder="e.g. EDITOR"
                                  className="w-full bg-[#0d1117] border border-blue-500 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 transition-colors uppercase sm:max-w-xs"
                                  required
                                  disabled={editLoading}
                                  autoFocus
                                />
                                {editError && (
                                  <span className="text-xs text-red-400">{editError}</span>
                                )}
                              </form>
                            </td>
                            <td className="p-4 text-gray-300">
                              {role.usersCount ?? 0} {(role.usersCount ?? 0) === 1 ? "user" : "users"}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => handleEditRole()}
                                  disabled={editLoading || !editRoleName.trim() || editRoleName.toUpperCase() === role.name.toUpperCase()}
                                  className="text-green-400 hover:text-green-300 font-medium transition-colors disabled:opacity-50"
                                >
                                  {editLoading ? "Saving..." : "Save"}
                                </button>
                                <button 
                                  onClick={() => setEditRoleId(null)}
                                  disabled={editLoading}
                                  className="text-gray-400 hover:text-gray-300 font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-medium text-gray-200">
                              {role.name}
                            </td>
                            <td className="p-4 text-gray-300">
                              {role.usersCount ?? 0} {(role.usersCount ?? 0) === 1 ? "user" : "users"}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => {
                                    setEditRoleId(role.id);
                                    setEditRoleName(role.name);
                                    setEditError(null);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteRole(role.id, role.name)}
                                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                                >
                                  Delete
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
          <div className="bg-[#161b22] rounded-3xl w-full max-w-md border border-[#30363d] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]">
              <h3 className="text-xl font-bold text-white">Add New Role</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {addError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {addError}
                </div>
              )}
              <form id="addRoleForm" onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. EDITOR"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors uppercase"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-[#30363d] flex justify-end gap-3 bg-[#161b22]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="addRoleForm"
                disabled={addLoading || !newRoleName.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addLoading && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal has been refactored to inline edit rows */}
    </main>
  );
}
