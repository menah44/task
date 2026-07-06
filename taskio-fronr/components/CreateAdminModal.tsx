import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  organizationName: string;
  onSuccess: () => void;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
}: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("All fields are required");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post(`/organizations/${organizationId}/admin`, formData);
      toast.success("Organization Admin created successfully!");
      onSuccess();
      onClose();
      setFormData({ firstName: "", lastName: "", email: "", password: "" });
    } catch (err: any) {
      console.error("Failed to create admin:", err);
      toast.error(err.response?.data?.message || "Failed to create organization admin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]/50">
          <div>
            <h3 className="text-lg font-bold text-white">Create Admin</h3>
            <p className="text-xs text-gray-400 mt-1">For {organizationName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
              minLength={8}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-[#1f242c] hover:bg-[#30363d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
