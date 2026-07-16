"use client";

import { useUserTheme } from "@/hooks/useUserTheme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useUserTheme();
  const { t } = useTranslation();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-md bg-transparent" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
      title={theme === "dark" ? t("topbar.switchToLight") : t("topbar.switchToDark")}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
