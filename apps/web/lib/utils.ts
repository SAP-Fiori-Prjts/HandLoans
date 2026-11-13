import { format, parse, isValid } from "date-fns";
import type { Loan, Repayment, PersonBalance } from "./types";

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
    const isoDate = dateStr.substring(0, 10);
    const parsed2 = parse(isoDate, "yyyy-MM-dd", new Date());
    if (isValid(parsed2)) return format(parsed2, "dd/MM/yyyy");
    // Fallback: JS Date string e.g. "Thu Jun 11 2026 00:00:00 GMT+0530 ..."
    const fallback = new Date(dateStr);
    if (isValid(fallback)) return format(fallback, "dd/MM/yyyy");
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    let date: Date | null = null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) date = parsed;
    else {
      const parsed2 = parse(dateStr.substring(0, 10), "yyyy-MM-dd", new Date());
      if (isValid(parsed2)) date = parsed2;
      else {
        const fallback = new Date(dateStr);
        if (isValid(fallback)) date = fallback;
      }
    }
    if (!date) return dateStr;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((todayMidnight.getTime() - targetMidnight.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const w = Math.round(diffDays / 7);
      return `${w} week${w > 1 ? "s" : ""} ago`;
    }
    if (diffDays < 365) {
      const m = Math.round(diffDays / 30);
      return `${m} month${m > 1 ? "s" : ""} ago`;
    }
    return format(date, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

export function today(): string {
  return format(new Date(), "dd/MM/yyyy");
}

export function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
    const isoDate = dateStr.substring(0, 10);
    const parsed2 = parse(isoDate, "yyyy-MM-dd", new Date());
    if (isValid(parsed2)) return isoDate;
    // Fallback: JS Date string
    const fallback = new Date(dateStr);
    if (isValid(fallback)) return format(fallback, "yyyy-MM-dd");
    return "";
  } catch { return ""; }
}

export function fromInputDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const parsed = parse(isoDate, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
    return "";
  } catch { return ""; }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

const AVATAR_COLORS = [
  { bg: "#1e3a5f", text: "#60a5fa" }, // blue
  { bg: "#3b1f5e", text: "#c084fc" }, // purple
  { bg: "#1a3a2a", text: "#34d399" }, // emerald
  { bg: "#4a1f1f", text: "#f87171" }, // red
  { bg: "#3a2a0f", text: "#fbbf24" }, // amber
  { bg: "#1a3a3a", text: "#22d3ee" }, // cyan
  { bg: "#3a1a2a", text: "#f472b6" }, // pink
  { bg: "#2a3a1a", text: "#86efac" }, // lime
];

export function getAvatarColor(name: string): { bg: string; text: string } {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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
  if (!digits) return "";
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `https://wa.me/${digits}`;
  return "";
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
  if (loan.amount === 0) return 0;
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
        totalRepaid: 0,
        activeLoans: 0,
        loans: [],
      });
    }

    const entry = map.get(loan.personName)!;
    entry.loans.push(loan);

    // Keep the first non-empty phone number found across all loans
    if (!entry.phoneNumber && loan.phoneNumber) {
      entry.phoneNumber = loan.phoneNumber;
    }

    if (isActive) {
      entry.activeLoans += 1;
      const effective = Math.max(0, remaining);
      if (loan.direction === "lent") {
        entry.netAmount += effective;
        entry.totalLent += effective;
      } else {
        entry.netAmount -= effective;
        entry.totalBorrowed += effective;
      }
    }
  }

  // Compute totalRepaid: sum of all repayments on lent loans for each person
  for (const entry of map.values()) {
    const lentIds = new Set(
      entry.loans.filter((l) => l.direction === "lent").map((l) => l.id)
    );
    entry.totalRepaid = repayments
      .filter((r) => lentIds.has(r.loanId))
      .reduce((sum, r) => sum + r.amount, 0);
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
