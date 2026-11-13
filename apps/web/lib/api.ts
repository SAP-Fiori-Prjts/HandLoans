import type { Loan, Repayment, AddLoanPayload, AddRepaymentPayload } from "./types";
import { today, generateId } from "./utils";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL;

// ─── Mock data (used when GAS_URL is not set) ───────────────────────────────

const MOCK_LOANS: Loan[] = [
  {
    id: "L001",
    personName: "Arjun Kumar",
    direction: "lent",
    amount: 15000,
    date: "05/10/2026",
    status: "active",
    reason: "Medical emergency",
    phoneNumber: "+91 9876543210",
  },
  {
    id: "L002",
    personName: "Priya Sharma",
    direction: "lent",
    amount: 8000,
    date: "12/10/2026",
    status: "active",
    reason: "Travel expenses",
    phoneNumber: "+91 9123456780",
  },
  {
    id: "L003",
    personName: "Arjun Kumar",
    direction: "lent",
    amount: 5000,
    date: "20/10/2026",
    status: "active",
    reason: "Grocery",
    phoneNumber: "+91 9876543210",
  },
  {
    id: "L004",
    personName: "Rahul Verma",
    direction: "borrowed",
    amount: 12000,
    date: "01/11/2026",
    status: "active",
    reason: "Personal loan",
    phoneNumber: "+91 9988776655",
  },
  {
    id: "L005",
    personName: "Sneha Patel",
    direction: "lent",
    amount: 3000,
    date: "08/11/2026",
    status: "settled",
    reason: "Lunch",
    phoneNumber: "+91 9001234567",
  },
];

const MOCK_REPAYMENTS: Repayment[] = [
  {
    id: "R001",
    loanId: "L001",
    amount: 5000,
    date: "15/10/2026",
    note: "Partial repayment",
    comment: "Via UPI",
  },
  {
    id: "R002",
    loanId: "L002",
    amount: 3000,
    date: "20/10/2026",
    note: "First instalment",
    comment: "",
  },
  {
    id: "R003",
    loanId: "L005",
    amount: 3000,
    date: "10/11/2026",
    note: "Full repayment",
    comment: "Cash",
  },
];

// ─── API helpers ─────────────────────────────────────────────────────────────

async function gasGet<T>(action: string): Promise<T> {
  const res = await fetch(`${GAS_URL}?action=${action}`);
  if (!res.ok) throw new Error(`GAS error: ${res.status}`);
  return res.json();
}

async function gasPost<T>(action: string, payload: object): Promise<T> {
  // No Content-Type header → avoids CORS preflight (GAS doesn't handle OPTIONS)
  const res = await fetch(`${GAS_URL}?action=${action}`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`GAS error: ${res.status}`);
  return res.json();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getLoans(): Promise<Loan[]> {
  if (!GAS_URL) return MOCK_LOANS;
  try {
    return await gasGet<Loan[]>("getLoans");
  } catch (e) {
    console.error("getLoans failed:", e);
    return [];
  }
}

export async function getRepayments(): Promise<Repayment[]> {
  if (!GAS_URL) return MOCK_REPAYMENTS;
  try {
    return await gasGet<Repayment[]>("getRepayments");
  } catch (e) {
    console.error("getRepayments failed:", e);
    return [];
  }
}

export async function addLoan(payload: AddLoanPayload): Promise<{ id: string }> {
  if (!GAS_URL) {
    const id = generateId("L", MOCK_LOANS.map((l) => l.id));
    MOCK_LOANS.push({ ...payload, id, status: "active" });
    return { id };
  }
  return gasPost("addLoan", payload);
}

export async function addRepayment(payload: AddRepaymentPayload): Promise<{ id: string }> {
  if (!GAS_URL) {
    const id = generateId("R", MOCK_REPAYMENTS.map((r) => r.id));
    MOCK_REPAYMENTS.push({ ...payload, id });
    return { id };
  }
  return gasPost("addRepayment", payload);
}

export async function updateLoanStatus(
  loanId: string,
  status: "active" | "settled"
): Promise<void> {
  if (!GAS_URL) {
    const loan = MOCK_LOANS.find((l) => l.id === loanId);
    if (loan) loan.status = status;
    return;
  }
  await gasPost("updateStatus", { loanId, status });
}
