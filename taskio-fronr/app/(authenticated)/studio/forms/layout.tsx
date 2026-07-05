"use client";

import React from "react";
import { Hammer } from "lucide-react";

export default function StudioFormsLayout({ children }: { children: React.ReactNode }) {
  // Instead of rendering children, we clearly mark this route and all subroutes as unavailable.
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-[#161b22] rounded-3xl border border-[#30363d] space-y-6" dir="ltr">
      <div className="p-4 bg-purple-500/10 rounded-full border border-purple-500/25 animate-bounce">
        <Hammer className="w-16 h-16 text-purple-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Forms Studio</h2>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          The Forms Studio module and its editing capabilities are currently unavailable because the Forms backend is not yet implemented.
        </p>
      </div>
      <span className="inline-block px-4 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
        Under Construction
      </span>
    </div>
  );
}
