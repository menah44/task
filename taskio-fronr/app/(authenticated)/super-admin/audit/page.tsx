"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import {
  ClipboardList,
  Calendar,
  User as UserIcon,
  RefreshCw,
  X,
  Eye,
  AlertCircle,
  Clock,
  Globe,
  Terminal,
  Building2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

interface AuditLog {
  id: number;
  actorId: number;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  createdAt: string;
  organization?: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export default function AuditLogsPage() {
  // ── Data states ──
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // ── Dropdown and filter states ──
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedActorId, setSelectedActorId] = useState<string>("");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // ── Drawer state ──
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [detailedLog, setDetailedLog] = useState<AuditLog | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch users for dropdown ──
  useEffect(() => {
    apiClient
      .get("/users", { params: { limit: 200 } })
      .then((res) => {
        const data = res.data;
        const users = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setAllUsers(users);
      })
      .catch(() => setAllUsers([]));
  }, []);

  // ── Fetch logs ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
      };
      if (selectedActorId) params.actorId = selectedActorId;
      if (selectedResourceType && selectedResourceType !== "ALL") {
        params.resourceType = selectedResourceType;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await apiClient.get("/audit", { params });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, selectedActorId, selectedResourceType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Reset filters ──
  const handleResetFilters = () => {
    setSelectedActorId("");
    setSelectedResourceType("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
    toast.success("Filters reset");
  };

  // ── Fetch detailed log for drawer ──
  const handleViewDetails = async (id: number) => {
    setSelectedLogId(id);
    setDrawerOpen(true);
    setLoadingDetail(true);
    setDetailedLog(null);
    try {
      const res = await apiClient.get(`/audit/${id}`);
      setDetailedLog(res.data);
    } catch {
      toast.error("Failed to load audit log details");
      setDrawerOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Helper formatting ──
  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.startsWith("CREATE")) {
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    }
    if (act.startsWith("UPDATE") || act.startsWith("ASSIGN")) {
      return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
    if (act.startsWith("DELETE") || act.startsWith("DEACTIVATE") || act.startsWith("REMOVE")) {
      return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }
    return "bg-purple-500/10 border-purple-500/20 text-purple-400";
  };

  const getResourceTypeColor = (resType: string) => {
    switch (resType.toUpperCase()) {
      case "USER":
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
      case "GROUP":
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
      case "ROLE":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "FORM":
        return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
    }
  };

  const getUserDisplayName = (u: User) =>
    u.firstName || u.lastName
      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
      : u.username || u.email;

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-purple-400" />
              Audit Logs
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Track user actions, database operations, and system administration activities
            </p>
          </div>
          <button
            onClick={() => {
              fetchLogs();
              toast.success("Logs refreshed");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-[#30363d] hover:bg-[#21262d] text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Filter System Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Actor Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" />
                Actor (User)
              </label>
              <select
                value={selectedActorId}
                onChange={(e) => {
                  setSelectedActorId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">All Actors</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUserDisplayName(u)}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5" />
                Resource Type
              </label>
              <select
                value={selectedResourceType}
                onChange={(e) => {
                  setSelectedResourceType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="ALL">All Types</option>
                <option value="USER">USER</option>
                <option value="GROUP">GROUP</option>
                <option value="ROLE">ROLE</option>
                <option value="FORM">FORM</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                End Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                />
                {(selectedActorId || selectedResourceType !== "ALL" || startDate || endDate) && (
                  <button
                    onClick={handleResetFilters}
                    title="Clear filters"
                    className="p-2 border border-[#30363d] bg-[#0d1117] hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 rounded-xl transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading && <SkeletonTable />}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#30363d]">
                <thead className="bg-[#161b22]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Resource Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Target ID
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Organization
                      </th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d] bg-[#0d1117]/50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-16 text-gray-500">
                        <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="font-semibold text-sm">No audit logs found</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Try adjustments to filters or check back later
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => handleViewDetails(log.id)}
                        className="hover:bg-[#21262d]/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-400">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-white">
                          {log.actorEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getResourceTypeColor(
                              log.resourceType
                            )}`}
                          >
                            {log.resourceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500 group-hover:text-gray-400 transition-colors">
                          {log.resourceId || "—"}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-300">
                            {log.organization ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                {log.organization.name}
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">System</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(log.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#30363d] flex items-center justify-between bg-[#161b22]">
                <div className="text-xs text-gray-500 font-medium">
                  Showing Page <span className="text-white font-semibold">{page}</span> of{" "}
                  <span className="text-white font-semibold">{totalPages}</span> (
                  <span className="text-white font-semibold">{total}</span> total entries)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-[#30363d] hover:bg-[#21262d] text-xs font-semibold text-white rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-[#30363d] hover:bg-[#21262d] text-xs font-semibold text-white rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-Over Side Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setDrawerOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer container */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-xl bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-[#30363d]">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                Audit Log Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">Log Identifier #{selectedLogId}</p>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingDetail ? (
              <div className="space-y-4">
                <div className="h-6 bg-[#21262d] rounded-lg animate-pulse w-2/3" />
                <div className="h-20 bg-[#21262d] rounded-lg animate-pulse" />
                <div className="h-40 bg-[#21262d] rounded-lg animate-pulse" />
              </div>
            ) : (
              detailedLog && (
                <>
                  {/* Summary Grid */}
                  <div className={`grid grid-cols-2 ${isSuperAdmin ? 'md:grid-cols-3' : ''} gap-4 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4`}>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-500">
                        Actor Email
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {detailedLog.actorEmail}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-500">
                        Actor ID
                      </span>
                      <span className="text-sm font-mono text-gray-300">
                        {detailedLog.actorId}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-500">
                        Action Executed
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${getActionBadgeColor(
                          detailedLog.action
                        )}`}
                      >
                        {detailedLog.action}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-500">
                        Resource Type / Target ID
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getResourceTypeColor(
                            detailedLog.resourceType
                          )}`}
                        >
                          {detailedLog.resourceType}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          #{detailedLog.resourceId || "—"}
                        </span>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-500">
                          Organization
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs font-medium text-gray-300">
                            {detailedLog.organization?.name || "System"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata Sections */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Network & Agent Metadata
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-gray-300 py-1">
                        <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-gray-500 w-24 flex-shrink-0">Event Time</span>
                        <span className="font-mono">{formatTimestamp(detailedLog.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-300 py-1">
                        <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-gray-500 w-24 flex-shrink-0">IP Address</span>
                        <span className="font-mono">{detailedLog.ipAddress || "—"}</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs text-gray-300 py-1">
                        <Terminal className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 w-24 flex-shrink-0">User Agent</span>
                        <span className="text-gray-300 text-left truncate hover:text-clip hover:whitespace-normal">
                          {detailedLog.userAgent || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payload Details */}
                  {detailedLog.details && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Action Payload Details & Changes
                      </h4>
                      <pre className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] overflow-x-auto text-xs text-indigo-300 font-mono leading-relaxed max-h-[300px]">
                        {JSON.stringify(detailedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#30363d] bg-[#161b22] flex justify-end">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-5 py-2.5 bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] text-white rounded-xl text-xs font-semibold transition-all"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
