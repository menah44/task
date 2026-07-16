"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, 
            retry: 2, 
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentLang = i18n.language || "en";
      const isRtl = currentLang.startsWith("ar");
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = currentLang;
    }
  }, [i18n.language]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            error: {
              duration: 10000,
            },
          }}
        />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
