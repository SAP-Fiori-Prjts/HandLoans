"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLoans, getRepayments, addLoan } from "@/lib/api";
import { buildPersonBalances } from "@/lib/utils";
import type { Loan, Repayment, AddLoanPayload } from "@/lib/types";
import BalanceCard from "@/components/BalanceCard";
import BottomNav from "@/components/BottomNav";
import AddLoanModal from "@/components/AddLoanModal";

export default function PeoplePage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);

  const loadData = useCallback(async () => {
    const [l, r] = await Promise.all([getLoans(), getRepayments()]);
    setLoans(l);
    setRepayments(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balances = buildPersonBalances(loans, repayments);

  const handleAddLoan = async (payload: AddLoanPayload) => {
    await addLoan(payload);
    await loadData();
  };

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-base">People</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/4" />)}
          </div>
        ) : balances.length === 0 ? (
          <p className="text-center py-16 text-slate-500 text-sm">No people yet</p>
        ) : (
          <div className="space-y-3">
            {balances.map((p) => (
              <BalanceCard
                key={p.personName}
                person={p}
                onClick={() => router.push(`/people/${encodeURIComponent(p.personName)}`)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav onAddLoan={() => setShowAddLoan(true)} />
      <AddLoanModal open={showAddLoan} onClose={() => setShowAddLoan(false)} onSubmit={handleAddLoan} />
    </div>
  );
}
