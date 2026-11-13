"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Loan, Repayment } from "@/lib/types";
import LoanCard from "./LoanCard";

interface LoanListProps {
  loans: Loan[];
  repayments: Repayment[];
  showPerson?: boolean;
}

type Filter = "all" | "active" | "settled";

export default function LoanList({ loans, repayments, showPerson = false }: LoanListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = loans
    .filter((l) => filter === "all" || l.status === filter)
    .filter((l) =>
      search
        ? l.personName?.toLowerCase().includes(search.toLowerCase()) ||
          l.reason?.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (a.status === "settled" && b.status !== "settled") return 1;
      if (a.status !== "settled" && b.status === "settled") return -1;
      return (b.date ?? "").localeCompare(a.date ?? "");
    });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "settled", label: "Settled" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === key
                ? "bg-indigo-500 text-white"
                : "bg-[#161f2e] border border-[#2a3547] text-slate-400 hover:border-[#3a4a60] hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <p className="text-sm">No loans found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              repayments={repayments}
              showPerson={showPerson}
            />
          ))}
        </div>
      )}
    </div>
  );
}
