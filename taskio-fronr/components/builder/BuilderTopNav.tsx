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
    <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex items-center justify-between shrink-0">
      <div>
        <div className="flex items-center gap-4">
          {TABS.map(({ key, label, href, icon: Icon }) => {
            const isActive = pathname?.includes(`/${key}`);
            return (
              <Link
                key={key}
                href={href(formId)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 ${
                  isActive
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-200 border-b-2 border-transparent"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
