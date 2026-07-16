"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Map as MapIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface BuilderTopNavProps {
  formId: string;
  /** Optional subtitle shown under the tabs, e.g. section/question counts */
  subtitle?: string;
  /** Right-aligned action buttons (Preview, Save, etc.) rendered by the parent page */
  actions?: React.ReactNode;
}

const TABS = [
  {
    key: "builder",
    labelKey: "builderNav.builder",
    href: (id: string) => `/studio/forms/${id}/builder`,
    icon: LayoutGrid,
  },
  {
    key: "map",
    labelKey: "builderNav.map",
    href: (id: string) => `/studio/forms/${id}/map`,
    icon: MapIcon,
  },
  {
    key: "settings",
    labelKey: "builderNav.settings",
    href: (id: string) => `/studio/forms/${id}/settings`,
    icon: SettingsIcon,
  },
] as const;

export default function BuilderTopNav({
  formId,
  subtitle,
  actions,
}: BuilderTopNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="bg-card border-b border-border px-6 h-16 flex items-center justify-between shrink-0 gap-4">
      {/* Left cluster: segmented tabs + contextual subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-0.5 bg-background border border-border rounded-lg p-1 shrink-0">
          {TABS.map(({ key, labelKey, href, icon: Icon }) => {
            const isActive = pathname?.includes(`/${key}`);
            return (
              <Link
                key={key}
                href={href(formId)}
                className={`flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm/15 text-primary"
                    : "text-muted-foreground hover:text-gray-200 hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4" />
                {t(labelKey)}
              </Link>
            );
          })}
        </div>

        {subtitle && (
          <>
            <div className="w-px h-5 bg-accent shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </>
        )}
      </div>

      {/* Right cluster: page-level actions, rendered by the parent page */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
