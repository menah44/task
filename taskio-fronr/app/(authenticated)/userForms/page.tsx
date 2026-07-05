"use client";

import React from "react";
import { ClipboardList } from "lucide-react";

export default function UserFormsPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-[#161b22] rounded-3xl border border-[#30363d] space-y-6" dir="ltr">
      <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/25">
        <ClipboardList className="w-16 h-16 text-blue-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Available Forms</h2>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          The User Forms module is currently under development. This section will display all assigned forms once the Forms backend module is fully implemented.
        </p>
      </div>
      <span className="inline-block px-4 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
        Coming Soon
      </span>
    </main>
  );
}
