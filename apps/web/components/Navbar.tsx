"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface NavbarProps {
  totalLent: number;
  totalBorrowed: number;
}

export default function Navbar({ totalLent, totalBorrowed }: NavbarProps) {
  const net = totalLent - totalBorrowed;

  return (
    <header className="sticky top-0 z-30 bg-[#0a0f1e] border-b border-[#1e2d40]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">HandLoans</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
            net >= 0
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/20 text-rose-400 border-rose-500/30"
          }`}
        >
          {net >= 0 ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}
          <span>{formatCurrency(net)}</span>
        </div>
      </div>

      {/* Summary strip */}
      <div className="max-w-lg mx-auto px-4 pb-2 flex gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Lent {formatCurrency(totalLent)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Borrowed {formatCurrency(totalBorrowed)}</span>
        </div>
      </div>
    </header>
  );
}
