"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddRepaymentPayload, Loan } from "@/lib/types";
import { today, formatCurrency, calcLoanBalance, toInputDate, fromInputDate } from "@/lib/utils";
import type { Repayment } from "@/lib/types";

interface AddRepaymentModalProps {
  open: boolean;
  loan: Loan | null;
  repayments: Repayment[];
  onClose: () => void;
  onSubmit: (payload: AddRepaymentPayload) => Promise<void>;
}

export default function AddRepaymentModal({
  open,
  loan,
  repayments,
  onClose,
  onSubmit,
}: AddRepaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState<"Partial" | "Full">("Partial");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = loan ? calcLoanBalance(loan, repayments) : 0;
  const enteredAmount = parseFloat(amount);
  const isFullAmount = !isNaN(enteredAmount) && enteredAmount === remaining;

  const reset = () => {
    setAmount("");
    setDate(today());
    setNote("Partial");
    setComment("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    // If amount no longer equals remaining, force back to Partial
    if (parseFloat(val) !== remaining) setNote("Partial");
  };

  const handleFullClick = () => {
    setAmount(String(remaining));
    setNote("Full");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan || !amount) return;
    setLoading(true);
    try {
      await onSubmit({
        loanId: loan.id,
        amount: enteredAmount,
        date,
        note,
        comment: comment.trim(),
      });
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && loan && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[51] bg-[#0f1729] rounded-t-3xl flex flex-col"
            style={{ maxHeight: "88dvh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Fixed top section */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Add Repayment</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-[#1e2d40] hover:bg-[#2a3547] flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-300" />
                </button>
              </div>

              {/* Loan info bar */}
              <div className="bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Repayment for</p>
                  <p className="text-sm font-semibold text-white">{loan.personName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-sm font-bold text-rose-400">{formatCurrency(remaining)}</p>
                </div>
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max={remaining}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors pr-16"
                    />
                    <button
                      type="button"
                      onClick={handleFullClick}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-indigo-400 bg-[#1e2d40] hover:bg-[#2a3547] px-2.5 py-1 rounded-full transition-colors"
                    >
                      Full
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={toInputDate(date)}
                    onChange={(e) => setDate(fromInputDate(e.target.value))}
                    className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                  />
                </div>

                {/* Note — Partial / Full toggle */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Payment Type
                  </label>
                  <div className="flex bg-[#161f2e] border border-[#2a3547] rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setNote("Partial")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        note === "Partial"
                          ? "bg-amber-500 text-white"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Partial
                    </button>
                    <button
                      type="button"
                      disabled={!isFullAmount}
                      onClick={() => isFullAmount && setNote("Full")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        note === "Full"
                          ? "bg-emerald-500 text-white"
                          : isFullAmount
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-700 cursor-not-allowed"
                      }`}
                    >
                      Full
                      {!isFullAmount && (
                        <span className="block text-[9px] font-normal text-slate-600 leading-none mt-0.5">
                          (enter full amount)
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Comment
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Via UPI, Cash"
                    className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className={`w-full text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all mt-1 ${
                    note === "Full"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-indigo-500 hover:bg-indigo-600"
                  }`}
                >
                  {loading ? "Saving…" : note === "Full" ? "Mark as Full Payment" : "Add Partial Payment"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
