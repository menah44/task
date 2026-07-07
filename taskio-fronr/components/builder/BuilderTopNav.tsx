"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Map as MapIcon,
  Settings as SettingsIcon,
} from "lucide-react";

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
    label: "Builder",
    href: (id: string) => `/studio/forms/${id}/builder`,
    icon: LayoutGrid,
  },
  {
    key: "map",
    label: "Map",
    href: (id: string) => `/studio/forms/${id}/map`,
    icon: MapIcon,
  },
  {
    key: "settings",
    label: "Settings",
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

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-6 h-16 flex items-center justify-between shrink-0 gap-4">
      {/* Left cluster: segmented tabs + contextual subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-0.5 bg-[#0d1117] border border-[#30363d] rounded-lg p-1 shrink-0">
          {TABS.map(({ key, label, href, icon: Icon }) => {
            const isActive = pathname?.includes(`/${key}`);
            return (
              <Link
                key={key}
                href={href(formId)}
                className={`flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {subtitle && (
          <>
            <div className="w-px h-5 bg-[#30363d] shrink-0" />
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
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
