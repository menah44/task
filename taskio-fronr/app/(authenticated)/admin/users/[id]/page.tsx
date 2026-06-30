"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";

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

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    role: "USER",
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

  const handleToggleStatus = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const endpoint = user.isActive 
        ? `/users/${user.id}/deactivate` 
        : `/users/${user.id}/activate`;
        
      await apiClient.patch(endpoint);
      
      alert(`User account ${user.isActive ? "disabled" : "enabled"} successfully`);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = () => {
    if (!user) return;
    setEditFormData({
      email: user.email || "",
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "USER",
    });
    setEditErrors({});
    setEditApiError(null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
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
      alert("User updated successfully");
      setIsEditModalOpen(false);
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
            <Link
              href="/admin/users"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              ← Back to Users
            </Link>
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
            <Link
              href="/admin/users"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 mb-4"
            >
              ← Back to Users
            </Link>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              User Details
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={openEditModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Edit User
            </button>
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

        {/* Details Card */}
        <div className="bg-[#161b22] rounded-3xl shadow-sm border border-[#30363d] overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              {/* ID */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">ID</p>
                <p className="text-lg text-white font-medium">{user.id}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.isActive 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Email */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Email</p>
                <p className="text-base text-gray-200 break-all">{user.email || "N/A"}</p>
              </div>

              {/* Username */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Username</p>
                <p className="text-base text-gray-200">{user.username || "N/A"}</p>
              </div>

              {/* First Name */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">First Name</p>
                <p className="text-base text-gray-200">{user.firstName || "N/A"}</p>
              </div>

              {/* Last Name */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Last Name</p>
                <p className="text-base text-gray-200">{user.lastName || "N/A"}</p>
              </div>

              {/* Role */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Role</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'ADMIN' 
                    ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {user.role || "N/A"}
                </span>
              </div>

              {/* Created At */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Created At</p>
                <p className="text-base text-gray-200">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161b22] rounded-3xl w-full max-w-lg border border-[#30363d] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {editApiError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {editApiError}
                </div>
              )}

              <form id="editUserForm" onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      className={`w-full bg-[#0d1117] border ${editErrors.firstName ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors`}
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
                      className={`w-full bg-[#0d1117] border ${editErrors.lastName ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors`}
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
                    className={`w-full bg-[#0d1117] border ${editErrors.username ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors`}
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
                    className={`w-full bg-[#0d1117] border ${editErrors.email ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {editErrors.email && <p className="mt-1 text-sm text-red-400">{editErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditChange}
                    className={`w-full bg-[#0d1117] border ${editErrors.role ? "border-red-500" : "border-[#30363d]"} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none`}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {editErrors.role && <p className="mt-1 text-sm text-red-400">{editErrors.role}</p>}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[#30363d] flex justify-end gap-3 shrink-0 bg-[#161b22]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editUserForm"
                disabled={editLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {editLoading && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
