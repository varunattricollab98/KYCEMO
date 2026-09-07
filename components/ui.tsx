import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-6 shadow-card backdrop-blur-sm sm:p-8 ${className}`}
    >
      {/* thin brand accent along the top edge */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-500 to-gold" />
      {children}
    </div>
  );
}

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
  disabled,
  onClick,
  full = true,
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "gold";
  disabled?: boolean;
  onClick?: () => void;
  full?: boolean;
}) {
  const base = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
    full ? "w-full" : ""
  }`;
  const styles = {
    primary:
      "bg-brand-gradient text-white shadow-glow hover:brightness-110 active:scale-[.99]",
    gold: "bg-gold text-navy shadow-soft hover:bg-gold-400 active:scale-[.99]",
    ghost:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[.99]",
    danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[.99]",
  }[variant];
  const cls = `${base} ${styles}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  if (href && disabled) {
    return (
      <span className={`${cls} pointer-events-none opacity-50`} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// Shared input styling used across the forms.
// text-base (16px) on mobile prevents iOS focus-zoom; sm:text-sm on desktop.
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base sm:text-sm text-navy shadow-soft outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export function Badge({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "red" | "blue";
  children: ReactNode;
}) {
  const styles = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-brand-light text-brand ring-brand-500/20",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles}`}
    >
      {children}
    </span>
  );
}
