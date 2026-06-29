"use client";

import React, { useState } from "react";
import { Users, UserPlus, Search, ArrowRight, ShieldCheck, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "Active" | "Inactive";
  joinedDate: string;
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: 1,
      name: "Ahmed Ali (System Admin)",
      email: "ahmed.admin@taskiopro.com",
      role: "ADMIN",
      status: "Active",
      joinedDate: "2026-01-15",
    },
    {
      id: 2,
      name: "Sara Khaled",
      email: "sara.khaled@taskiopro.com",
      role: "USER",
      status: "Active",
      joinedDate: "2026-03-22",
    },
    {
      id: 3,
      name: "Omar Farooq",
      email: "omar.farooq@taskiopro.com",
      role: "USER",
      status: "Inactive",
      joinedDate: "2026-05-10",
    },
    {
      id: 4,
      name: "Fatima Ahmed",
      email: "fatima.ahmed@taskiopro.com",
      role: "USER",
      status: "Active",
      joinedDate: "2026-06-01",
    },
  ]);

  const toggleUserStatus = (id: number) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="space-y-8 text-[#c9d1d9]" dir="ltr">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/admin" className="hover:text-blue-500 transition-colors flex items-center gap-1">
              Dashboard <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
            <span>/</span>
            <span className="text-white font-medium">User Management</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-500" />
            User Management & Permissions
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Add new users, edit permissions, and manage account statuses across the system.
          </p>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-md text-sm border border-blue-500/20">
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-gray-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#161b22]/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1f242c] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ShieldCheck className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          user.status === "Active"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {user.status === "Active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                      {user.joinedDate}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          user.status === "Active"
                            ? "text-red-400 border-red-500/10 bg-red-500/5 hover:bg-red-500/10"
                            : "text-green-400 border-green-500/10 bg-green-500/5 hover:bg-green-500/10"
                        }`}
                      >
                        {user.status === "Active" ? "Disable Account" : "Enable Account"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
