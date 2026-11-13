"use client";

import { useState } from "react";
import { X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddLoanPayload } from "@/lib/types";
import { today, phoneToStorage } from "@/lib/utils";

interface AddLoanModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddLoanPayload) => Promise<void>;
  defaultPersonName?: string;
}

// Accepts: 9876543210 | +91 9876543210 | 91 9876543210 | +919876543210
function validateIndianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits || digits === "91") return null; // empty or just country code = optional
  if (digits.length === 10 && /^[6-9]/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2])) return null;
  return "Enter a valid 10-digit Indian mobile number (starting with 6–9)";
}

// Auto-formats digits to DD/MM/YYYY as user types
function autoFormatDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function validateDate(d: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return false;
  const [dd, mm, yyyy] = d.split("/").map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 2000) return false;
  return true;
}

export default function AddLoanModal({ open, onClose, onSubmit, defaultPersonName }: AddLoanModalProps) {
  const [direction, setDirection] = useState<"lent" | "borrowed">("lent");
  const [personName, setPersonName] = useState(defaultPersonName ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setDirection("lent");
    setPersonName(defaultPersonName ?? "");
    setAmount("");
    setDate(today());
    setReason("");
    setPhoneNumber("+91 ");
    setPhoneError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (phoneError) setPhoneError(validateIndianPhone(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount) return;
    if (!validateDate(date)) return;

    const phoneErr = validateIndianPhone(phoneNumber);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        personName: personName.trim(),
        direction,
        amount: parseFloat(amount),
        date,
        reason: reason.trim(),
        phoneNumber: phoneToStorage(phoneNumber),
      });
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_: unknown, info: { offset: { y: number } }) => { if (info.offset.y > 80) handleClose(); }}
          >
            {/* Fixed top section */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-4 cursor-grab" />

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Add Loan</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-[#1e2d40] hover:bg-[#2a3547] flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-300" />
                </button>
              </div>

              {/* Direction toggle */}
              <div className="flex bg-[#161f2e] rounded-xl p-1">
                {(["lent", "borrowed"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      direction === d
                        ? d === "lent"
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {d === "lent" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    {d === "lent" ? "I Lent" : "I Borrowed"}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {/* Person Name */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    readOnly={!!defaultPersonName}
                    placeholder="Enter name"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all ${
                      defaultPersonName
                        ? "bg-[#1e2d40] border-[#2a3547] cursor-default"
                        : "bg-[#161f2e] border-[#2a3547] focus:border-indigo-500"
                    }`}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all"
                  />
                </div>

                {/* Date + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                      Date
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={date}
                      onChange={(e) => setDate(autoFormatDate(e.target.value))}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className={`w-full bg-[#161f2e] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all ${
                        date && !validateDate(date) ? "border-rose-500" : "border-[#2a3547]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={() => setPhoneError(validateIndianPhone(phoneNumber))}
                      placeholder="+91 98765 43210"
                      className={`w-full bg-[#161f2e] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                        phoneError
                          ? "border-rose-500 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
                          : "border-[#2a3547] focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                      }`}
                    />
                  </div>
                </div>

                {/* Phone error message */}
                {phoneError && (
                  <p className="text-xs text-rose-400 -mt-1 px-1">{phoneError}</p>
                )}

                {/* Reason */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Travel, Medical, Grocery"
                    className="w-full bg-[#161f2e] border border-[#2a3547] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !personName.trim() || !amount}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all mt-1"
                >
                  {loading ? "Saving…" : "Add Loan"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
