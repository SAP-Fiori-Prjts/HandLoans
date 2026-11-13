"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import BalanceCard from "@/components/BalanceCard";
import AddLoanModal from "@/components/AddLoanModal";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { getLoans, getRepayments, addLoan } from "@/lib/api";
import { buildPersonBalances, formatCurrency } from "@/lib/utils";
import type { Loan, Repayment, PersonBalance, AddLoanPayload } from "@/lib/types";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    try {
      await addLoan(payload);
      await loadData();
      setToast({ message: "Loan added", type: "success" });
    } catch {
      setToast({ message: "Failed to add loan", type: "error" });
    }
  };

  const balances = buildPersonBalances(loans, repayments);
  const totalLent = balances.reduce((s, b) => s + b.totalLent, 0);
  const totalBorrowed = balances.reduce((s, b) => s + b.totalBorrowed, 0);
  const net = totalLent - totalBorrowed;

  const positiveBalances = balances.filter((b) => b.netAmount > 0);
  const negativeBalances = balances.filter((b) => b.netAmount < 0);

  const handlePersonClick = (person: PersonBalance) => {
    router.push(`/people?name=${encodeURIComponent(person.personName)}`);
  };

  return (
    <div className="min-h-dvh bg-[#0a0f1e] pb-24">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Hero stats row */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#161f2e] border border-emerald-500/20 rounded-2xl p-3 flex flex-col items-center gap-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[10px] text-slate-400">You're Owed</p>
              <p className="text-sm font-bold text-emerald-400 leading-tight">{formatCurrency(totalLent)}</p>
            </div>
            <div className="bg-[#161f2e] border border-rose-500/20 rounded-2xl p-3 flex flex-col items-center gap-1">
              <TrendingDown size={14} className="text-rose-400" />
              <p className="text-[10px] text-slate-400">You Owe</p>
              <p className="text-sm font-bold text-rose-400 leading-tight">{formatCurrency(totalBorrowed)}</p>
            </div>
            <div className={`bg-[#161f2e] border rounded-2xl p-3 flex flex-col items-center gap-1 ${net > 0 ? "border-emerald-500/20" : net < 0 ? "border-rose-500/20" : "border-[#2a3547]"}`}>
              <Minus size={14} className={net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-slate-400"} />
              <p className="text-[10px] text-slate-400">Net Balance</p>
              <p className={`text-sm font-bold leading-tight ${net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-slate-400"}`}>
                {net === 0 ? "₹0" : (net > 0 ? "+" : "-") + formatCurrency(net).replace("₹", "₹")}
              </p>
            </div>
          </div>
        )}

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
                    <BalanceCard key={p.personName} person={p} onClick={() => handlePersonClick(p)} />
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
                    <BalanceCard key={p.personName} person={p} onClick={() => handlePersonClick(p)} />
                  ))}
                </div>
              </section>
            )}

          </>
        )}
      </main>

      <BottomNav onAddLoan={() => setShowAddLoan(true)} />

      <AddLoanModal open={showAddLoan} onClose={() => setShowAddLoan(false)} onSubmit={handleAddLoan} />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
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
      <div className="mb-6">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="20" fill="#161f2e"/>
          <path d="M40 56V28" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M28 40L40 28L52 40" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M40 24V24" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="28" cy="56" r="5" fill="#f43f5e" opacity="0.7"/>
          <circle cx="52" cy="56" r="5" fill="#34d399" opacity="0.7"/>
          <circle cx="40" cy="56" r="4" fill="#6366f1"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">No loans yet</h3>
      <p className="text-sm text-slate-400 mb-6">
        Tap the + button below to record your first hand loan
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

