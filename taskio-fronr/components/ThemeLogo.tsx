"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Renders the correct logo variant based on the active theme.
 * - Light mode  → logo-light.png (black logo)
 * - Dark mode   → logo-dark.png  (white logo)
 *
 * mix-blend-mode is applied to handle PNG images with white backgrounds:
 * - "multiply"  in light mode: white areas in the PNG become transparent
 * - "screen"    in dark mode:  black areas in the PNG become transparent
 *
 * Mounted guard prevents a hydration flash.
 */
export default function ThemeLogo({ className = "", width = 160, height = 52 }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Invisible placeholder preserves layout while theme resolves
    return <div style={{ width, height }} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  const src = isDark ? "/logo-dark.png" : "/logo-light.png";

  return (
    <Image
      src={src}
      alt="StrategizeIT Logo"
      width={width}
      height={height}
      priority
      className={className}
      style={{
        objectFit: "contain",
        mixBlendMode: isDark ? "screen" : "multiply",
      }}
    />
  );
}
