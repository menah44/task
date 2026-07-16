"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/components/SkeletonTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatters";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Group {
  id: number;
  name: string;
  parentId?: number | null;
  membersCount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface GroupNode extends Group {
  children: GroupNode[];
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

function buildTree(groups: Group[]): GroupNode[] {
  const map = new Map<number, GroupNode>();
  const roots: GroupNode[] = [];

  // First pass: create all nodes
  groups.forEach((g) => {
    map.set(g.id, { ...g, children: [] });
  });

  // Second pass: assign children to parents
  groups.forEach((g) => {
    const node = map.get(g.id)!;
    if (g.parentId && map.has(g.parentId)) {
      map.get(g.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <span
      className={`${cls} border-2 border-current border-t-transparent rounded-full animate-spin inline-block`}
    />
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: GroupNode;
  depth: number;
  expandedIds: Set<number>;
  selectedId: number | null;
  onToggle: (id: number) => void;
  onSelect: (node: GroupNode) => void;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
  dragOverId: number | null;
  onDragStart: (group: Group) => void;
  onDragOver: (e: React.DragEvent, id: number) => void;
  onDrop: (e: React.DragEvent, targetId: number) => void;
  onDragEnd: () => void;
}

function GroupTreeNode({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isDragOver = dragOverId === node.id;

  return (
    <div>
      {/* Node Row */}
      <div
        draggable
        onDragStart={() => onDragStart(node)}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDrop={(e) => onDrop(e, node.id)}
        onDragEnd={onDragEnd}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        className={`group flex items-center gap-2 py-2.5 pe-3 rounded-xl cursor-pointer transition-all select-none border ${
          isSelected
            ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300"
            : isDragOver
            ? "bg-blue-500/10 border-blue-500/30"
            : "border-transparent hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => onSelect(node)}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren
              ? "text-muted-foreground hover:text-foreground"
              : "text-transparent cursor-default"
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            )
          ) : (
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          )}
        </button>

        {/* Folder Icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0 text-indigo-400" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0 text-indigo-400/70" />
        )}

        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-muted-foreground transition-colors">
          <Users className="w-3 h-3" />
          {formatNumber(node.membersCount, "en")} {/* Will fix it below if I can pass i18n language, or I can use i18n directly */}
        </span>

        {/* Action Buttons */}
        <div
          className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(node)}
            title="Edit group"
            className="p-1 rounded-lg text-muted-foreground hover:text-primary/80 hover:bg-blue-500/10 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(node)}
            title="Delete group"
            className="p-1 rounded-lg text-muted-foreground hover:text-error hover:bg-error/15 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute top-0 bottom-0 border-s border-border"
            style={{ left: `${depth * 24 + 20}px` }}
          />
          {node.children.map((child) => (
            <GroupTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              dragOverId={dragOverId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Members Panel ────────────────────────────────────────────────────────────

interface Member {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface MembersPanelProps {
  group: GroupNode;
  onClose: () => void;
}

function MembersPanel({ group, onClose }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/groups/${group.id}/members`);
      setMembers(res.data);
    } catch {
      // Endpoint may not exist yet — show empty state
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [group.id]);

  useEffect(() => {
    fetchMembers();
    // Fetch all users for the add-member dropdown
    // GET /users returns paginated { items, total, ... } — extract the array
    apiClient
      .get("/users", { params: { limit: 200 } })
      .then((r) => {
        const data = r.data;
        const users = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setAllUsers(users);
      })
      .catch(() => setAllUsers([]));
  }, [fetchMembers]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      await apiClient.post(`/groups/${group.id}/members`, {
        userId: Number(selectedUserId),
      });
      toast.success(t("adminGroups.memberAdded"));
      setSelectedUserId("");
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("adminGroups.failedAddMember"));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setRemovingId(userId);
    try {
      await apiClient.delete(`/groups/${group.id}/members/${userId}`);
      toast.success(t("adminGroups.memberRemoved"));
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("adminGroups.failedRemoveMember"));
    } finally {
      setRemovingId(null);
    }
  };

  const memberIds = new Set(members.map((m) => m.id));
  const safeUsers = Array.isArray(allUsers) ? allUsers : [];
  const availableUsers = safeUsers.filter((u) => !memberIds.has(u.id));

  const displayName = (u: Member) =>
    u.firstName || u.lastName
      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
      : u.username || u.email;

  return (
    <div className="w-80 flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-foreground truncate max-w-[160px]">
              {group.name}
            </h3>
            <p className="text-xs text-muted-foreground">{t("adminGroups.members")}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>

      {/* Add Member */}
      <div className="p-4 border-b border-border">
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          {t("adminGroups.addMember")}
        </label>
        <div className="flex gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">{t("adminGroups.selectUser")}</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {displayName(u)}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMember}
            disabled={!selectedUserId || addingMember}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {addingMember ? <Spinner /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loadingMembers ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">{t("adminGroups.noMembers")}</p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg p-3 group"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium truncate">
                  {displayName(member)}
                </p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              <button
                onClick={() => handleRemoveMember(member.id)}
                disabled={removingId === member.id}
                className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error/15 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                {removingId === member.id ? (
                  <Spinner />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface GroupModalProps {
  mode: "create" | "edit";
  groups: Group[];
  initial?: { name: string; parentId: number | null };
  onSubmit: (name: string, parentId: number | null) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

function GroupModal({
  mode,
  groups,
  initial,
  onSubmit,
  onClose,
  loading,
  error,
}: GroupModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [parentId, setParentId] = useState<number | null>(
    initial?.parentId ?? null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name.trim(), parentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-md border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {mode === "create" ? t("adminGroups.createGroup") : t("adminGroups.editGroup")}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form id="groupForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("adminGroups.groupName")} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("adminGroups.groupNamePlaceholder")}
              autoFocus
              required
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("adminGroups.parentGroup")}{" "}
              <span className="text-muted-foreground font-normal">{t("adminGroups.optional")}</span>
            </label>
            <select
              value={parentId ?? ""}
              onChange={(e) =>
                setParentId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="">{t("adminGroups.noParent")}</option>
              {groups
                .filter((g) => !initial || g.id !== (initial as any).id)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t("adminGroups.cancel")}
          </button>
          <button
            type="submit"
            form="groupForm"
            disabled={loading || !name.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Spinner />}
            {mode === "create" ? t("adminGroups.create") : t("adminGroups.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const { t, i18n } = useTranslation();
  // ── Data state ──
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Tree UI state ──
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<GroupNode | null>(null);

  // ── Create modal state ──
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Edit modal state ──
  const [editTarget, setEditTarget] = useState<Group | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Confirm dialog ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ title: "", description: "", onConfirm: () => {} });

  // ── Drag state ──
  const [dragSource, setDragSource] = useState<Group | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/groups");
      setGroups(res.data);
      // Auto-expand all parent nodes on first load
      const parents = new Set<number>();
      (res.data as Group[]).forEach((g) => {
        if (g.parentId) parents.add(g.parentId);
      });
      setExpandedIds(parents);
    } catch (err: any) {
      setError(err.response?.data?.message || t("adminGroups.failedLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Tree ───────────────────────────────────────────────────────────────────

  const tree = buildTree(groups);

  const handleToggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async (name: string, parentId: number | null) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await apiClient.post("/groups", { name, parentId });
      toast.success(t("adminGroups.groupCreated"));
      setShowCreate(false);
      await fetchGroups();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || t("adminGroups.failedCreate"));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (name: string, parentId: number | null) => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.put(`/groups/${editTarget.id}`, { name, parentId });
      toast.success(t("adminGroups.groupUpdated"));
      setEditTarget(null);
      await fetchGroups();
    } catch (err: any) {
      setEditError(err.response?.data?.message || t("adminGroups.failedUpdate"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (group: Group) => {
    setConfirmConfig({
      title: t("adminGroups.deleteConfirmTitle"),
      description: t("adminGroups.deleteConfirmDesc", { groupName: group.name }),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/groups/${group.id}`);
          toast.success(t("adminGroups.groupDeleted"));
          if (selectedGroup?.id === group.id) setSelectedGroup(null);
          await fetchGroups();
        } catch (err: any) {
          toast.error(err.response?.data?.message || t("adminGroups.failedDelete"));
        }
      },
    });
    setConfirmOpen(true);
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const isDescendantOf = useCallback(
    (possibleDescendantId: number, ancestorId: number): boolean => {
      const checkDescendant = (nodeId: number): boolean => {
        const node = groups.find((g) => g.id === nodeId);
        if (!node || !node.parentId) return false;
        if (node.parentId === ancestorId) return true;
        return checkDescendant(node.parentId);
      };
      return checkDescendant(possibleDescendantId);
    },
    [groups]
  );

  const handleDragStart = useCallback((group: Group) => {
    if (isMoving) return;
    setDragSource(group);
  }, [isMoving]);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: number) => {
      e.preventDefault();
      if (isMoving) return;
      if (dragSource && dragSource.id !== targetId && !isDescendantOf(targetId, dragSource.id)) {
        setDragOverId(targetId);
      }
    },
    [dragSource, isDescendantOf, isMoving]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: number) => {
      e.preventDefault();
      setDragOverId(null);
      if (!dragSource || dragSource.id === targetId || isMoving) return;

      if (isDescendantOf(targetId, dragSource.id)) {
        toast.error(t("adminGroups.moveError"));
        return;
      }

      setIsMoving(true);
      // Optimistically update UI
      setGroups((prev) =>
        prev.map((g) =>
          g.id === dragSource.id ? { ...g, parentId: targetId } : g
        )
      );

      try {
        await apiClient.put(`/groups/${dragSource.id}/parent/${targetId}`);
        toast.success(t("adminGroups.movedSuccess", { groupName: dragSource.name }));
      } catch (err: any) {
        toast.error(
          err.response?.data?.message ||
            t("adminGroups.failedMove")
        );
        // Revert on failure
        await fetchGroups();
      } finally {
        setIsMoving(false);
        setDragSource(null);
      }
    },
    [dragSource, fetchGroups, isDescendantOf, isMoving]
  );

  const handleDragEnd = useCallback(() => {
    setDragSource(null);
    setDragOverId(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Folder className="w-8 h-8 text-indigo-400" />
              {t("adminGroups.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("adminGroups.desc")}
            </p>
          </div>
          <button
            onClick={() => {
              setCreateError(null);
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-xl text-sm font-semibold transition-all shadow-md border border-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            {t("adminGroups.addGroup")}
          </button>
        </div>

        {/* Body */}
        {loading && <SkeletonTable />}

        {error && (
          <div className="flex items-center gap-3 bg-error/15 border border-error/20 text-error p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="flex gap-4 items-start">
            {/* Tree Panel */}
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("adminGroups.groupHierarchy")}
                  </h2>
                  <span className="text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-full px-2 py-0.5 font-medium">
                    {formatNumber(groups.length, i18n.language)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                    {t("adminGroups.dragToReparent")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t("adminGroups.clickViewMembers")}
                  </span>
                </div>
              </div>

              {/* Tree */}
              <div className="p-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragSource && dragSource.parentId !== null && !isMoving) {
                      setDragOverId(-1);
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverId(null);
                    if (!dragSource || dragSource.parentId === null || isMoving) return;

                    setIsMoving(true);
                    // Optimistically update UI
                    setGroups((prev) =>
                      prev.map((g) =>
                        g.id === dragSource.id ? { ...g, parentId: null } : g
                      )
                    );

                    try {
                      await apiClient.put(`/groups/${dragSource.id}/parent/null`);
                      toast.success(t("adminGroups.movedToRoot", { groupName: dragSource.name }));
                    } catch (err: any) {
                      toast.error(
                        err.response?.data?.message ||
                          t("adminGroups.failedMoveRoot")
                      );
                      await fetchGroups();
                    } finally {
                      setIsMoving(false);
                      setDragSource(null);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl text-center text-xs font-semibold tracking-wide transition-all overflow-hidden ${
                    dragSource && dragSource.parentId !== null
                      ? "mb-3 py-3 opacity-100 h-auto"
                      : "opacity-0 h-0 pointer-events-none mb-0 border-transparent"
                  } ${
                    dragOverId === -1
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "border-border text-muted-foreground hover:text-muted-foreground"
                  }`}
                >
                  {t("adminGroups.dropToRoot")}
                </div>
                {tree.length === 0 ? (
                  <div className="py-16 text-center">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">{t("adminGroups.noGroups")}</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t("adminGroups.clickToAdd")}
                    </p>
                  </div>
                ) : (
                  tree.map((node) => (
                    <GroupTreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      expandedIds={expandedIds}
                      selectedId={selectedGroup?.id ?? null}
                      onToggle={handleToggle}
                      onSelect={setSelectedGroup}
                      onEdit={setEditTarget}
                      onDelete={handleDelete}
                      dragOverId={dragOverId}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Members Panel */}
            {selectedGroup && (
              <MembersPanel
                group={selectedGroup}
                onClose={() => setSelectedGroup(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <GroupModal
          mode="create"
          groups={groups}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          loading={createLoading}
          error={createError}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <GroupModal
          mode="edit"
          groups={groups}
          initial={{ name: editTarget.name, parentId: editTarget.parentId ?? null }}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
          loading={editLoading}
          error={editError}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
        confirmText={t("adminGroups.deleteBtn")}
      />
    </main>
  );
}
