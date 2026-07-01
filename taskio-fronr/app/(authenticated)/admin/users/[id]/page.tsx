"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

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
        setError("User not found.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Unauthorized to view this user.");
      } else {
        setError("An unexpected server error occurred.");
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
        e.returnValue = "You have unsaved changes. Leave without saving?";
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
      toast.success("Role updated successfully");
    } catch (err: any) {
      console.error("Failed to update role", err);
      toast.error(err.response?.data?.message || "Failed to update role");
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
      toast.success("User updated successfully");
      setIsDirty(false);
      await fetchUser();
    } catch (err: any) {
      if (err.response?.status === 409) {
        const msg = err.response.data?.message;
        if (msg?.includes("Username")) setEditErrors({ username: msg });
        else if (msg?.includes("Email")) setEditErrors({ email: msg });
        else setEditApiError(msg || "Conflict error");
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
          setEditApiError(err.response.data?.message || "Validation failed.");
        }
      } else if (err.response?.status === 404) {
        setEditApiError("User not found.");
      } else {
        setEditApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-8 bg-[#30363d] rounded w-1/4 mb-4"></div>
            <div className="bg-[#161b22] rounded-3xl p-8 border border-[#30363d] h-64"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <button
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave without saving?")) return;
                router.push('/admin/users');
              }}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              ← Back to Users
            </button>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-gray-300">{error || "User not found"}</p>
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
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave without saving?")) return;
                router.push('/admin/users');
              }}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 mb-4"
            >
              ← Back to Users
            </button>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              User Details
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border ${
                user.isActive 
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20" 
                  : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
              } disabled:opacity-50`}
            >
              {actionLoading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              )}
              {user.isActive ? "Disable Account" : "Enable Account"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-[#30363d] mb-6">
          {["Profile", "Roles", "Groups"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
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
                }
                setActiveTab(tab);
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-[#30363d]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className="bg-[#161b22] rounded-3xl shadow-sm border border-[#30363d] overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              </div>
              
              {editApiError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {editApiError}
                </div>
              )}

              <form id="editUserForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      className={`w-full bg-[#0d1117] border ${editErrors.firstName ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                    />
                    {editErrors.firstName && <p className="mt-1 text-sm text-red-400">{editErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditChange}
                      className={`w-full bg-[#0d1117] border ${editErrors.lastName ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                    />
                    {editErrors.lastName && <p className="mt-1 text-sm text-red-400">{editErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditChange}
                    className={`w-full bg-[#0d1117] border ${editErrors.username ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {editErrors.username && <p className="mt-1 text-sm text-red-400">{editErrors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className={`w-full bg-[#0d1117] border ${editErrors.email ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {editErrors.email && <p className="mt-1 text-sm text-red-400">{editErrors.email}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {editLoading && (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "Roles" && (
          <div className="bg-[#161b22] rounded-3xl shadow-sm border border-[#30363d] p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6">User Role</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {user.role ? (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                  user.role.toUpperCase() === "ADMIN"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : user.role.toUpperCase() === "USER"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }`}>
                  {user.role}
                </span>
              ) : (
                <p className="text-gray-400 text-sm">No role assigned.</p>
              )}
            </div>

            <div className="border-t border-[#30363d] pt-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Change Role</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors flex-1 w-full sm:max-w-xs appearance-none"
                >
                  <option value="">Select a role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleRoleChangeSubmit}
                  disabled={!selectedRole || addRoleLoading || selectedRole === user.role}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {addRoleLoading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  )}
                  Save Role
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Groups" && (
          <div className="bg-[#161b22] rounded-3xl shadow-sm border border-[#30363d] p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6">User Groups</h3>
            {userGroups.length === 0 ? (
              <div className="text-center py-8 bg-[#0d1117] rounded-xl border border-[#30363d] border-dashed">
                <p className="text-gray-400 text-sm">No groups assigned to this user.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userGroups.map(group => (
                  <div key={group.id} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex items-center justify-between">
                    <span className="text-gray-200 font-medium">{group.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
}
