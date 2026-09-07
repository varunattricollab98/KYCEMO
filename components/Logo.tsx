// EaseMyOffice wordmark with a small building glyph, in brand navy/gold.
export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "light" ? "text-white" : "text-navy";
  const sub = variant === "light" ? "text-white/60" : "text-slate-400";
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
        {/* building glyph */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14 21V10h5a1 1 0 0 1 1 1v10M3 21h18M7 9h3M7 13h3M7 17h3M17 14h.01M17 18h.01"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-bold tracking-tight ${text}`}>
          EaseMyOffice
        </span>
        <span className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${sub}`}>
          KYC Verification
        </span>
      </span>
    </div>
  );
}
