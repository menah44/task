"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-full text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground transition-colors animate-pulse">
        <Globe className="w-4 h-4 opacity-50" />
      </button>
    );
  }

  const currentLang = i18n.language || "en";
  
  const toggleLanguage = () => {
    const nextLang = currentLang.startsWith("ar") ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center relative group"
      title={currentLang.startsWith("ar") ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="w-5 h-5" />
      <span className="absolute -top-1 -end-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded-sm uppercase leading-none shadow-sm group-hover:scale-110 transition-transform">
        {currentLang.startsWith("ar") ? "ع" : "EN"}
      </span>
    </button>
  );
}
