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
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 ${className}`}
    >
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
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
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
    // Disabled link: render a non-interactive, dimmed element.
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Badge({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "red" | "blue";
  children: ReactNode;
}) {
  const styles = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-brand-light text-brand-dark",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}
