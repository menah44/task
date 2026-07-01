"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Group {
  id: number;
  name: string;
  membersCount: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/groups');
      setGroups(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setAddLoading(true);
    setAddError(null);
    try {
      await apiClient.post('/groups', { name: newGroupName });
      setIsAddModalOpen(false);
      setNewGroupName("");
      await fetchGroups();
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add group");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    triggerConfirm(
      "Delete Group",
      `Are you sure you want to delete the group '${groupName}'? This action cannot be undone.`,
      async () => {
        try {
          await apiClient.delete(`/groups/${groupId}`);
          toast.success("Group deleted successfully");
          await fetchGroups();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to delete group");
        }
      }
    );
  };

  const openEditModal = (group: Group) => {
    setEditGroupId(group.id);
    setEditGroupName(group.name);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim() || editGroupId === null) return;
    
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.put(`/groups/${editGroupId}`, { name: editGroupName });
      setIsEditModalOpen(false);
      setEditGroupName("");
      setEditGroupId(null);
      await fetchGroups();
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update group");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Groups Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Add Group
          </button>
        </div>
        
        {loading && <SkeletonTable />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]">
              <h2 className="text-lg font-semibold text-white">All Groups</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#21262d] border-b border-[#30363d] text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <th className="p-4 py-3">Group Name</th>
                    <th className="p-4 py-3">Members Count</th>
                    <th className="p-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d] text-sm text-gray-300">
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        No groups found.
                      </td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr key={group.id} className="hover:bg-[#21262d]/50 transition-colors">
                        <td className="p-4 font-medium text-gray-200">
                          {group.name}
                        </td>
                        <td className="p-4 text-gray-300">
                          {group.membersCount}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => openEditModal(group)}
                              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="text-red-400 hover:text-red-300 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
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
              <h3 className="text-xl font-bold text-white">Add New Group</h3>
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
              <form id="addGroupForm" onSubmit={handleAddGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                form="addGroupForm"
                disabled={addLoading || !newGroupName.trim()}
                className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161b22] rounded-3xl w-full max-w-md border border-[#30363d] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]">
              <h3 className="text-xl font-bold text-white">Edit Group</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {editError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {editError}
                </div>
              )}
              <form id="editGroupForm" onSubmit={handleEditGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-[#30363d] flex justify-end gap-3 bg-[#161b22]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editGroupForm"
                disabled={editLoading || !editGroupName.trim()}
                className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {editLoading && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                )}
                Save
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
    </main>
  );
}
