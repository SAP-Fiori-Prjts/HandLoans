"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
import type { Loan, Repayment } from "@/lib/types";
import { formatCurrency, formatDate, formatRelativeDate, calcLoanBalance, calcRepaymentProgress } from "@/lib/utils";

interface LoanCardProps {
  loan: Loan;
  repayments: Repayment[];
  showPerson?: boolean;
}

export default function LoanCard({ loan, repayments, showPerson = false }: LoanCardProps) {
  const remaining = calcLoanBalance(loan, repayments);
  const progress = calcRepaymentProgress(loan, repayments);
  const isLent = loan.direction === "lent";
  const isSettled = loan.status === "settled";

  return (
    <Link href={`/loans?id=${loan.id}`} className="block text-white no-underline">
      <div
        className={`relative rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden ${
          isSettled
            ? "bg-[#161f2e] border-[#2a3547] opacity-60"
            : "bg-[#161f2e] border-[#2a3547] hover:border-[#3a4a60]"
        }`}
      >
        {/* Left color bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
            isSettled ? "bg-slate-600" : isLent ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />

        <div className="pl-5 pr-3 py-3">
          <div className="flex items-center gap-3">
            {/* Direction icon */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSettled
                  ? "bg-slate-700"
                  : isLent
                  ? "bg-emerald-500/20"
                  : "bg-rose-500/20"
              }`}
            >
              {isLent ? (
                <ArrowUpRight
                  size={16}
                  className={isSettled ? "text-slate-500" : "text-emerald-400"}
                />
              ) : (
                <ArrowDownLeft
                  size={16}
                  className={isSettled ? "text-slate-500" : "text-rose-400"}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {showPerson ? (
                    <p className="text-sm font-semibold text-white truncate">
                      {loan.personName}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-white truncate">
                      {loan.reason || "—"}
                    </p>
                  )}
                  <span className="text-xs text-slate-400">{formatRelativeDate(loan.date)}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-lg font-bold leading-tight ${
                        isSettled
                          ? "text-slate-400"
                          : isLent
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(isSettled ? loan.amount : remaining)}
                    </span>

                    {isSettled ? (
                      <span className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full text-xs font-semibold border border-slate-600">
                        Settled
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isLent
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {isLent ? "Lent" : "Borrowed"}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              </div>

              {/* Repayment progress bar */}
              {!isSettled && progress > 0 && (
                <div className="mt-2 h-1 bg-[#2a3547] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
