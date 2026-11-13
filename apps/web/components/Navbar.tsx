"use client";

import { Wallet } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-[#1e2d40]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-white leading-none">HandLoans</p>
          <p className="text-[10px] text-slate-500 leading-tight">Personal loan tracker</p>
        </div>
      </div>
    </header>
  );
}

