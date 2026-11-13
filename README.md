# HandLoans

A personal hand-loan tracker web app inspired by Splitwise. Track money you lend and borrow from people, manage repayments, and see live balances — works in any browser and installs as a mobile app (PWA).

---

## Features

- **Add Loans** — Record who you lent to or borrowed from, with amount, date, and reason
- **Track Repayments** — Log partial or full repayments against any loan
- **Balance Summary** — See net balance per person (green = they owe you, red = you owe them)
- **Loan History** — Full timeline with filters, repayment progress bar
- **Auto-settle** — Loan automatically marked settled when fully repaid
- **PWA** — Install on Android/iOS home screen, works offline (read-only)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| PWA | next-pwa (service worker, offline cache) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Font | Inter (via @fontsource/inter) |
| Date utilities | date-fns |
| Database | Google Sheets (2 sheets: Loans + Repayments) |
| API / Backend | Google Apps Script Web App |

---

## Architecture

```
Google Sheets (Loans + Repayments)
       ↕  Google Apps Script Web App (REST API)
       ↕  Next.js PWA (browser + mobile home screen)
```

The Google Apps Script Web App acts as the backend API. The Next.js app calls it via `fetch`. No server or database to maintain.

---

## Google Sheet Setup

Create a Google Sheet with **2 sheets (tabs)**:

### Sheet 1 — `Loans`

| Column | Name | Type | Values |
|--------|------|------|--------|
| A | ID | Text | L001, L002, … |
| B | Person Name | Text | Name of the person |
| C | Direction | Text | `lent` or `borrowed` |
| D | Amount | Number | Original loan amount |
| E | Date | Date | DD/MM/YYYY |
| F | Status | Text | `active` or `settled` |
| G | Reason | Text | e.g. Travel, Medical |
| H | Phone Number | Text | e.g. +91 9876543210 |

### Sheet 2 — `Repayments`

| Column | Name | Type | Values |
|--------|------|------|--------|
| A | ID | Text | R001, R002, … |
| B | Loan ID | Text | Must match a Loans.ID |
| C | Amount | Number | Amount repaid |
| D | Date | Date | DD/MM/YYYY |
| E | Note | Text | Short note |
| F | Comment | Text | Additional comments |

> Row 1 in both sheets must be the header row. Data starts from Row 2.

### Google Sheet
- **Spreadsheet ID**: `17TJV0lfqcZn_n1omLFrh_LsJx1dLusXoVWJHpb8GiAo`
- **URL**: https://docs.google.com/spreadsheets/d/17TJV0lfqcZn_n1omLFrh_LsJx1dLusXoVWJHpb8GiAo

---

## Google Apps Script Setup

1. Open your Google Sheet → **Extensions → Apps Script**
2. Paste the contents of `scripts/Code.gs` into the editor
3. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL

### API Actions

| Action | Method | Description |
|---|---|---|
| `getLoans` | GET | Fetch all rows from Loans sheet |
| `getRepayments` | GET | Fetch all rows from Repayments sheet |
| `addLoan` | POST | Append new loan row, auto-generate ID |
| `addRepayment` | POST | Append repayment, auto-settle loan if fully repaid |
| `updateStatus` | POST | Manually mark a loan active or settled |

---

## Project Structure

```
HandLoans/
├── apps/
│   └── web/                            # Next.js App Router project
│       ├── public/
│       │   ├── manifest.json           # PWA manifest
│       │   ├── icon-192.png            # App icon (192×192)
│       │   └── icon-512.png            # App icon (512×512)
│       ├── app/
│       │   ├── layout.tsx              # Root layout, PWA meta tags
│       │   ├── page.tsx                # Dashboard — balance summary
│       │   └── loans/
│       │       └── [id]/page.tsx       # Loan detail + repayment history
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── BalanceCard.tsx         # Per-person net balance card
│       │   ├── LoanList.tsx            # Filterable loan list
│       │   ├── LoanCard.tsx            # Single loan row
│       │   ├── AddLoanModal.tsx        # Add loan form
│       │   ├── AddRepaymentModal.tsx   # Add repayment form
│       │   └── BottomNav.tsx           # Mobile bottom navigation bar
│       ├── lib/
│       │   ├── types.ts                # TypeScript interfaces
│       │   ├── api.ts                  # Fetch helpers → Apps Script URL
│       │   └── utils.ts               # Balance calc, date formatting
│       ├── .env.local                  # GAS URL (not committed)
│       ├── next.config.ts
│       └── tailwind.config.ts
└── scripts/
    └── Code.gs                        # Google Apps Script source
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Google Sheet set up (see above)
- Apps Script Web App deployed (see below)

### Install & Run

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> The app runs with **mock data** until you add the Apps Script URL to `.env.local`.

### Production Build

```bash
npm run build
npm start
```

---

## Wiring Up Google Sheets (One-Time Setup)

1. Open your Google Sheet → **Extensions → Apps Script**
2. Delete the default code, paste the full contents of `scripts/Code.gs`
3. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL
5. Open `apps/web/.env.local` and set:
   ```
   NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```
6. Restart `npm run dev` — the app now reads/writes from your Google Sheet

---

## PWA — Install on Phone

1. Open the app URL in **Chrome (Android)** or **Safari (iOS)**
2. Tap the browser menu → **"Add to Home Screen"**
3. App opens full-screen like a native app
4. Works offline — loads last cached data when no internet

---

## Design System

| Element | Value |
|---|---|
| Background | `#0a0f1e` deep navy |
| Cards | Glassmorphism — `bg-white/5 backdrop-blur border border-white/10` |
| Positive (owed to you) | `#10b981` Emerald |
| Negative (you owe) | `#f43f5e` Rose |
| Accent / FAB | `#6366f1` Indigo |
| Font | Inter |
| Animations | Framer Motion (modals slide up, cards scale on hover) |

---

## Pending Setup (by user)

- [x] Create Google Sheet with Loans + Repayments tabs ✓
- [ ] Deploy `scripts/Code.gs` as Apps Script Web App
- [ ] Add Web App URL to `apps/web/.env.local`

---

## Status

> **App is built and running.** Uses mock data until Google Sheet URL is configured in `.env.local`.
