"use client";

import { Phone, MessageCircle, ChevronRight } from "lucide-react";
import type { PersonBalance } from "@/lib/types";
import {
  formatCurrency,
  getInitials,
  buildWhatsAppUrl,
  buildCallUrl,
  phoneToDisplay,
} from "@/lib/utils";

interface BalanceCardProps {
  person: PersonBalance;
  onClick: () => void;
}

export default function BalanceCard({ person, onClick }: BalanceCardProps) {
  const isPositive = person.netAmount >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-[#161f2e] shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        isPositive
          ? "border-emerald-500/40 hover:border-emerald-500/60"
          : "border-rose-500/40 hover:border-rose-500/60"
      }`}
      onClick={onClick}
    >
      {/* Glow accent top line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${
          isPositive
            ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            : "bg-gradient-to-r from-transparent via-rose-400 to-transparent"
        }`}
      />

      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isPositive
                  ? "bg-[#1a3a2a] text-emerald-300"
                  : "bg-[#3a1a1e] text-rose-300"
              }`}
            >
              {getInitials(person.personName)}
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">
                {person.personName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {person.activeLoans} active loan{person.activeLoans !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Amount + chevron */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p
                className={`text-2xl font-bold ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(person.netAmount)}
              </p>
              <p className="text-[10px] text-slate-500">
                {isPositive ? "owes you" : "you owe"}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-600" />
          </div>
        </div>

        {/* Phone actions */}
        {person.phoneNumber && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2a3547]">
            <span className="text-xs text-slate-500 flex-1 truncate">
              {phoneToDisplay(person.phoneNumber)}
            </span>
            <a
              href={buildCallUrl(person.phoneNumber)}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-[#1e2d40] hover:bg-[#253650] flex items-center justify-center transition-colors no-underline"
              aria-label="Call"
            >
              <Phone size={14} className="text-slate-300" />
            </a>
            <a
              href={buildWhatsAppUrl(person.phoneNumber)}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#1a3a2a] hover:bg-[#1f4530] flex items-center justify-center transition-colors no-underline"
              aria-label="WhatsApp"
            >
              <MessageCircle size={14} className="text-emerald-400" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
