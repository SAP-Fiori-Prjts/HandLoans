"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Plus } from "lucide-react";
import { getLoans, getRepayments, addLoan, addRepayment } from "@/lib/api";
import {
  buildPersonBalances,
  formatCurrency,
  buildCallUrl,
  buildWhatsAppUrl,
  getInitials,
  phoneToDisplay,
} from "@/lib/utils";
import type { Loan, Repayment, AddLoanPayload, AddRepaymentPayload } from "@/lib/types";
import LoanCard from "@/components/LoanCard";
import AddLoanModal from "@/components/AddLoanModal";
import AddRepaymentModal from "@/components/AddRepaymentModal";

export default function PersonPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const personName = decodeURIComponent(name);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | null>(null);

  const loadData = useCallback(async () => {
    const [l, r] = await Promise.all([getLoans(), getRepayments()]);
    setLoans(l.filter((loan) => loan.personName === personName));
    setRepayments(r);
    setLoading(false);
  }, [personName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balances = buildPersonBalances(loans, repayments);
  const person = balances.find((b) => b.personName === personName);
  const isPositive = (person?.netAmount ?? 0) >= 0;

  const handleAddLoan = async (payload: AddLoanPayload) => {
    await addLoan({ ...payload, personName });
    await loadData();
  };

  const handleAddRepayment = async (payload: AddRepaymentPayload) => {
    await addRepayment(payload);
    await loadData();
  };

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-base">{personName}</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {!loading && person && (
          <div className={`rounded-2xl border p-5 ${isPositive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${isPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {getInitials(personName)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-lg">{personName}</p>
                <p className={`text-xl font-bold mt-0.5 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(person.netAmount)}
                </p>
                <p className="text-xs text-slate-500">{isPositive ? "owes you" : "you owe"}</p>
              </div>
            </div>

            {person.phoneNumber && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-slate-500 flex-1">{phoneToDisplay(person.phoneNumber)}</span>
                <a href={buildCallUrl(person.phoneNumber)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-xs text-slate-300">
                  <Phone size={12} /> Call
                </a>
                <a href={buildWhatsAppUrl(person.phoneNumber)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddLoan(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold"
          >
            <Plus size={16} /> New Loan
          </button>
        </div>

        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Loans</h2>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white/4" />)}
            </div>
          ) : loans.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-sm">No loans with this person</p>
          ) : (
            <div className="space-y-2">
              {loans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} repayments={repayments} />
              ))}
            </div>
          )}
        </section>
      </div>

      <AddLoanModal open={showAddLoan} onClose={() => setShowAddLoan(false)} onSubmit={handleAddLoan} />
      <AddRepaymentModal
        open={!!repaymentLoan}
        loan={repaymentLoan}
        repayments={repayments}
        onClose={() => setRepaymentLoan(null)}
        onSubmit={handleAddRepayment}
      />
    </div>
  );
}
