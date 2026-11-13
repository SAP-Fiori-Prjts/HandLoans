import { format, parse, isValid } from "date-fns";
import type { Loan, Repayment, PersonBalance } from "./types";

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return format(parsed, "dd MMM yyyy");
    const fallback = new Date(dateStr);
    if (isValid(fallback)) return format(fallback, "dd MMM yyyy");
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function today(): string {
  return format(new Date(), "dd/MM/yyyy");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function buildWhatsAppUrl(phone: string | undefined | null): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}`;
}

export function buildCallUrl(phone: string | undefined | null): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  return `tel:${phone ?? ""}`;
}

// Strip to 10 digits for storage in Google Sheet
export function phoneToStorage(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(-10);
}

// Add +91 prefix for display in the UI
export function phoneToDisplay(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
  return String(phone);
}

export function calcLoanBalance(loan: Loan, repayments: Repayment[]): number {
  const paid = repayments
    .filter((r) => r.loanId === loan.id)
    .reduce((sum, r) => sum + r.amount, 0);
  return loan.amount - paid;
}

export function calcRepaymentProgress(loan: Loan, repayments: Repayment[]): number {
  const paid = repayments
    .filter((r) => r.loanId === loan.id)
    .reduce((sum, r) => sum + r.amount, 0);
  return Math.min(100, (paid / loan.amount) * 100);
}

export function buildPersonBalances(
  loans: Loan[],
  repayments: Repayment[]
): PersonBalance[] {
  const map = new Map<string, PersonBalance>();

  for (const loan of loans) {
    const remaining = calcLoanBalance(loan, repayments);
    const isActive = loan.status === "active";

    if (!map.has(loan.personName)) {
      map.set(loan.personName, {
        personName: loan.personName,
        phoneNumber: loan.phoneNumber,
        netAmount: 0,
        totalLent: 0,
        totalBorrowed: 0,
        activeLoans: 0,
        loans: [],
      });
    }

    const entry = map.get(loan.personName)!;
    entry.loans.push(loan);

    if (isActive) {
      entry.activeLoans += 1;
      if (loan.direction === "lent") {
        entry.netAmount += remaining;
        entry.totalLent += remaining;
      } else {
        entry.netAmount -= remaining;
        entry.totalBorrowed += remaining;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    Math.abs(b.netAmount) - Math.abs(a.netAmount)
  );
}

export function generateId(prefix: string, existing: string[]): string {
  const nums = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}
