import { useAuthStore } from "@/lib/auth-store";

export default function OrgBadge() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const orgName = (currentUser as any)?.organization?.name || "Form";

  return (
    <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-left">
      <p className="text-[10px] text-gray-400 leading-none">Organization</p>
      <p className="font-semibold text-xs text-primary leading-tight mt-0.5 max-w-[120px] truncate" title={orgName}>{orgName}</p>
    </div>
  );
}
