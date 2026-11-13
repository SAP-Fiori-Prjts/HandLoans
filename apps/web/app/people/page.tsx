"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Plus } from "lucide-react";
import { getLoans, getRepayments, addLoan, addRepayment } from "@/lib/api";
import {
  buildPersonBalances, formatCurrency, buildCallUrl,
  buildWhatsAppUrl, getInitials, getAvatarColor, phoneToDisplay,
} from "@/lib/utils";
import type { Loan, Repayment, AddLoanPayload, AddRepaymentPayload } from "@/lib/types";
import BalanceCard from "@/components/BalanceCard";
import LoanCard from "@/components/LoanCard";
import BottomNav from "@/components/BottomNav";
import AddLoanModal from "@/components/AddLoanModal";
import AddRepaymentModal from "@/components/AddRepaymentModal";
import Toast from "@/components/Toast";
import { AnimatePresence } from "framer-motion";

function PeopleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personName = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : null;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    const [l, r] = await Promise.all([getLoans(), getRepayments()]);
    setLoans(l);
    setRepayments(r);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddLoan = async (payload: AddLoanPayload) => {
    await addLoan({ ...payload, personName: personName || payload.personName });
    await loadData();
    setToast({ message: "Loan added", type: "success" });
  };

  const handleAddRepayment = async (payload: AddRepaymentPayload) => {
    await addRepayment(payload);
    await loadData();
    setToast({ message: "Repayment recorded", type: "success" });
  };

  // ── Person Detail View ────────────────────────────────────────────────────
  if (personName) {
    const personLoans = loans.filter((l) => l.personName === personName);
    const balances = buildPersonBalances(personLoans, repayments);
    const person = balances.find((b) => b.personName === personName);
    const isPositive = (person?.netAmount ?? 0) >= 0;

    return (
      <div className="min-h-dvh pb-28">
        <header className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-[#161f2e] flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-base">{personName}</span>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {!loading && person && (
            <div className={`rounded-2xl border p-5 ${isPositive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: getAvatarColor(personName).bg, color: getAvatarColor(personName).text }}
                >
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
                  <a href={buildCallUrl(person.phoneNumber)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e2d40] text-xs text-slate-300">
                    <Phone size={12} /> Call
                  </a>
                  <a href={buildWhatsAppUrl(person.phoneNumber)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {(() => {
              const lentIds = new Set(personLoans.filter((l) => l.direction === "lent").map((l) => l.id));
              const totalRepaid = repayments.filter((r) => lentIds.has(r.loanId)).reduce((s, r) => s + r.amount, 0);
              const outstanding = person ? Math.max(0, person.netAmount) : 0;
              return (
                <>
                  <div className="bg-[#161f2e] border border-[#2a3547] rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">{personLoans.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total Loans</p>
                  </div>
                  <div className="bg-[#161f2e] border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-emerald-400 leading-tight">{formatCurrency(totalRepaid)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Repaid</p>
                  </div>
                  <div className="bg-[#161f2e] border border-indigo-500/20 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-indigo-300 leading-tight">{formatCurrency(outstanding)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Outstanding</p>
                  </div>
                </>
              );
            })()}
          </div>

          <button onClick={() => setShowAddLoan(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold">
            <Plus size={16} /> New Loan
          </button>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Loans</h2>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="relative rounded-xl border border-[#2a3547] bg-[#161f2e] overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2a3547] rounded-l-xl" />
                    <div className="pl-5 pr-3 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#2a3547] flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 rounded-md bg-[#2a3547]" />
                        <div className="h-2.5 w-16 rounded-md bg-[#1e2d40]" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="h-4 w-16 rounded-md bg-[#2a3547]" />
                        <div className="h-3 w-10 rounded-md bg-[#1e2d40]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : personLoans.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No loans with this person</p>
            ) : (
              <div className="space-y-2">
                {personLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} repayments={repayments} />
                ))}
              </div>
            )}
          </section>
        </div>

        <AddLoanModal open={showAddLoan} onClose={() => setShowAddLoan(false)} onSubmit={handleAddLoan} defaultPersonName={personName} />
        <AddRepaymentModal open={!!repaymentLoan} loan={repaymentLoan} repayments={repayments} onClose={() => setRepaymentLoan(null)} onSubmit={handleAddRepayment} />
        <BottomNav onAddLoan={() => setShowAddLoan(true)} />
        <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ── People List View ──────────────────────────────────────────────────────
  const balances = buildPersonBalances(loans, repayments);

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-[#161f2e] flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-base">People</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#2a3547] bg-[#161f2e] p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#2a3547] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded-md bg-[#2a3547]" />
                  <div className="h-2.5 w-16 rounded-md bg-[#1e2d40]" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-5 w-16 rounded-md bg-[#2a3547]" />
                  <div className="h-2.5 w-10 rounded-md bg-[#1e2d40]" />
                </div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <p className="text-center py-16 text-slate-500 text-sm">No people yet</p>
        ) : (
          <div className="space-y-3">
            {balances.map((p) => (
              <BalanceCard key={p.personName} person={p} onClick={() => router.push(`/people?name=${encodeURIComponent(p.personName)}`)} />
            ))}
          </div>
        )}
      </main>

      <BottomNav onAddLoan={() => setShowAddLoan(true)} />
      <AddLoanModal open={showAddLoan} onClose={() => setShowAddLoan(false)} onSubmit={handleAddLoan} />
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}

export default function PeoplePage() {
  return <Suspense><PeopleContent /></Suspense>;
}
