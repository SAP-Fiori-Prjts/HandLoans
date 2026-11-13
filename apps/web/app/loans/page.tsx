"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getLoans, getRepayments, addLoan } from "@/lib/api";
import type { Loan, Repayment, AddLoanPayload } from "@/lib/types";
import LoanList from "@/components/LoanList";
import BottomNav from "@/components/BottomNav";
import AddLoanModal from "@/components/AddLoanModal";

export default function LoansPage() {
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

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-[#2a3547] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-[#161f2e] border border-[#2a3547] flex items-center justify-center text-white"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-base text-white">All Loans</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#161f2e]" />
            ))}
          </div>
        ) : (
          <LoanList loans={loans} repayments={repayments} showPerson />
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
