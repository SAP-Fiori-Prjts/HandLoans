"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle,
  RotateCcw,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { getLoans, getRepayments, addRepayment, updateLoanStatus } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  calcLoanBalance,
  calcRepaymentProgress,
  buildCallUrl,
  buildWhatsAppUrl,
  phoneToDisplay,
} from "@/lib/utils";
import type { Loan, Repayment, AddRepaymentPayload } from "@/lib/types";
import AddRepaymentModal from "@/components/AddRepaymentModal";

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRepayment, setShowRepayment] = useState(false);
  const [settling, setSettling] = useState(false);

  const loadData = useCallback(async () => {
    const [loans, reps] = await Promise.all([getLoans(), getRepayments()]);
    const found = loans.find((l) => l.id === id) ?? null;
    setLoan(found);
    setRepayments(reps.filter((r) => r.loanId === id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRepayment = async (payload: AddRepaymentPayload) => {
    await addRepayment(payload);
    await loadData();
  };

  const handleToggleSettle = async () => {
    if (!loan) return;
    setSettling(true);
    const newStatus = loan.status === "settled" ? "active" : "settled";
    await updateLoanStatus(loan.id, newStatus);
    await loadData();
    setSettling(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0a0f1e] animate-pulse p-4 space-y-4">
        <div className="h-10 w-32 rounded-xl bg-[#161f2e]" />
        <div className="h-40 rounded-2xl bg-[#161f2e]" />
        <div className="h-24 rounded-2xl bg-[#161f2e]" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-dvh bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-slate-400">Loan not found</p>
      </div>
    );
  }

  const remaining = calcLoanBalance(loan, repayments);
  const progress = calcRepaymentProgress(loan, repayments);
  const isLent = loan.direction === "lent";
  const isSettled = loan.status === "settled";

  return (
    <div className="min-h-dvh bg-[#0a0f1e] pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0a0f1e] border-b border-[#1e2d40] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-[#161f2e] hover:bg-[#2a3547] flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} className="text-slate-300" />
        </button>
        <span className="font-semibold text-sm text-white">{loan.personName}</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Loan summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161f2e] border border-[#2a3547] rounded-2xl p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">
                {isLent ? "You lent" : "You borrowed"}
              </p>
              <p
                className={`text-3xl font-bold ${
                  isSettled ? "text-slate-400" : isLent ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(loan.amount)}
              </p>
              {!isSettled && remaining !== loan.amount && (
                <p className="text-xs text-slate-400 mt-1">
                  Remaining: {formatCurrency(remaining)}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isSettled
                  ? "bg-[#1e2d40] text-slate-400"
                  : "bg-[#1e2d40] text-indigo-300 border border-[#2a3547]"
              }`}
            >
              {isSettled ? "Settled" : "Active"}
            </span>
          </div>

          {/* Progress bar */}
          {!isSettled && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Repaid</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-[#1e2d40] rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Date</p>
              <p className="text-slate-200 font-medium">{formatDate(loan.date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Reason</p>
              <p className="text-slate-200 font-medium">{loan.reason || "—"}</p>
            </div>
          </div>

          {/* Phone actions */}
          {loan.phoneNumber && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2a3547]">
              <span className="text-xs text-slate-400 flex-1">{phoneToDisplay(loan.phoneNumber)}</span>
              <a
                href={buildCallUrl(loan.phoneNumber)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e2d40] hover:bg-[#2a3547] text-xs text-slate-300 transition-colors"
              >
                <Phone size={12} /> Call
              </a>
              <a
                href={buildWhatsAppUrl(loan.phoneNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d2b1a] hover:bg-[#153d25] text-xs text-emerald-400 transition-colors"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        {!isSettled && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRepayment(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Add Repayment
            </button>
            <button
              onClick={handleToggleSettle}
              disabled={settling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} /> Mark Settled
            </button>
          </div>
        )}

        {isSettled && (
          <button
            onClick={handleToggleSettle}
            disabled={settling}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#161f2e] border border-[#2a3547] hover:bg-[#1e2d40] text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} /> Mark as Active
          </button>
        )}

        {/* Repayment history */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Repayment History
          </h2>
          {repayments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No repayments yet
            </div>
          ) : (
            <div className="space-y-2">
              {repayments.map((rep, i) => (
                <motion.div
                  key={rep.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0d2b1a] flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(rep.amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(rep.date)}
                      {rep.note ? ` · ${rep.note}` : ""}
                      {rep.comment ? ` · ${rep.comment}` : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddRepaymentModal
        open={showRepayment}
        loan={loan}
        repayments={repayments}
        onClose={() => setShowRepayment(false)}
        onSubmit={handleAddRepayment}
      />
    </div>
  );
}
