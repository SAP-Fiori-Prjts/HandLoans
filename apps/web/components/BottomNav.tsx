"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Plus, Users } from "lucide-react";

interface BottomNavProps {
  onAddLoan: () => void;
}

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/loans", icon: List, label: "Loans" },
  { href: "/people", icon: Users, label: "People" },
];

export default function BottomNav({ onAddLoan }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1526] border-t border-[#1e2d40]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pb-safe">
        {NAV_ITEMS.slice(0, 2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === "/loans" && pathname.startsWith("/loans"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-4 min-w-[56px] transition-colors ${
                active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 mx-auto mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* Center FAB */}
        <button
          onClick={onAddLoan}
          className="relative -top-5 w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-all"
          aria-label="Add loan"
        >
          <Plus size={24} className="text-white" />
        </button>

        {NAV_ITEMS.slice(2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "?");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-4 min-w-[56px] transition-colors ${
                active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 mx-auto mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
