import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "react-i18next";

export default function OrgBadge() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const orgName = (currentUser as any)?.organization?.name || "Form";
  const { t } = useTranslation();

  return (
    <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-start">
      <p className="text-[10px] text-muted-foreground leading-none">{t("topbar.organization")}</p>
      <p className="font-semibold text-xs text-primary leading-tight mt-0.5 max-w-[120px] truncate" title={orgName}>{orgName}</p>
    </div>
  );
}
