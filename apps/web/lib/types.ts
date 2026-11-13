export interface Loan {
  id: string;
  personName: string;
  direction: "lent" | "borrowed";
  amount: number;
  date: string;
  status: "active" | "settled";
  reason: string;
  phoneNumber: string;
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  note: string;
  comment: string;
}

export interface PersonBalance {
  personName: string;
  phoneNumber: string;
  netAmount: number;       // positive = they owe you, negative = you owe them
  totalLent: number;
  totalBorrowed: number;
  totalRepaid: number;
  activeLoans: number;
  loans: Loan[];
}

export interface AddLoanPayload {
  personName: string;
  direction: "lent" | "borrowed";
  amount: number;
  date: string;
  reason: string;
  phoneNumber: string;
}

export interface AddRepaymentPayload {
  loanId: string;
  amount: number;
  date: string;
  note: string;
  comment: string;
}
