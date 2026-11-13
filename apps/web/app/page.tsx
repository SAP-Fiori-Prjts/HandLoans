"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import BalanceCard from "@/components/BalanceCard";
import AddLoanModal from "@/components/AddLoanModal";
import BottomNav from "@/components/BottomNav";
import { getLoans, getRepayments, addLoan } from "@/lib/api";
import { buildPersonBalances } from "@/lib/utils";
import type { Loan, Repayment, PersonBalance, AddLoanPayload } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
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

  const handleAddLoan = async (payload: AddLoanPayload) => {
    await addLoan(payload);
    await loadData();
  };

  const balances = buildPersonBalances(loans, repayments);
  const totalLent = balances.reduce((s, b) => s + b.totalLent, 0);
  const totalBorrowed = balances.reduce((s, b) => s + b.totalBorrowed, 0);

  const positiveBalances = balances.filter((b) => b.netAmount > 0);
  const negativeBalances = balances.filter((b) => b.netAmount < 0);
  const zeroBalances = balances.filter((b) => b.netAmount === 0 && b.loans.length > 0);

  const handlePersonClick = (person: PersonBalance) => {
    router.push(`/people?name=${encodeURIComponent(person.personName)}`);
  };

  return (
    <div className="min-h-dvh bg-[#0a0f1e] pb-24">
      <Navbar totalLent={totalLent} totalBorrowed={totalBorrowed} />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <LoadingSkeleton />
        ) : balances.length === 0 ? (
          <EmptyState onAdd={() => setShowAddLoan(true)} />
        ) : (
          <>
            {positiveBalances.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Owed to You
                </h2>
                <div className="space-y-3">
                  {positiveBalances.map((p) => (
                    <BalanceCard
                      key={p.personName}
                      person={p}
                      onClick={() => handlePersonClick(p)}
                    />
                  ))}
                </div>
              </section>
            )}

            {negativeBalances.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  You Owe
                </h2>
                <div className="space-y-3">
                  {negativeBalances.map((p) => (
                    <BalanceCard
                      key={p.personName}
                      person={p}
                      onClick={() => handlePersonClick(p)}
                    />
                  ))}
                </div>
              </section>
            )}

            {zeroBalances.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Settled
                </h2>
                <div className="space-y-3">
                  {zeroBalances.map((p) => (
                    <BalanceCard
                      key={p.personName}
                      person={p}
                      onClick={() => handlePersonClick(p)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav onAddLoan={() => setShowAddLoan(true)} />

      <AddLoanModal
        open={showAddLoan}
        onClose={() => setShowAddLoan(false)}
        onSubmit={handleAddLoan}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-[#161f2e]" />
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1a2035] flex items-center justify-center mb-4">
        <span className="text-3xl">💸</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">No loans yet</h3>
      <p className="text-sm text-slate-400 mb-6">
        Start by recording your first hand loan
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
      >
        Add First Loan
      </button>
    </div>
  );
}
