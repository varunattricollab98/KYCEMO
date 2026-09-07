// EaseMyOffice wordmark with a premium building glyph, in brand navy/gold.
export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "light" ? "text-white" : "text-navy";
  const sub = variant === "light" ? "text-white/55" : "text-slate-400";
  return (
    <div className="flex items-center gap-3">
      {/* Logo mark: layered gradient tile + gold ring + inner highlight + glow */}
      <span className="relative inline-flex">
        {/* soft outer glow */}
        <span className="absolute inset-0 rounded-2xl bg-brand-500/40 blur-md" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow ring-1 ring-white/20">
          {/* top inner highlight for depth */}
          <span className="pointer-events-none absolute inset-x-1 top-1 h-4 rounded-xl bg-white/15 blur-[2px]" />
          {/* gold accent corner */}
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-navy/40" />
          {/* building glyph */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="relative text-white drop-shadow"
          >
            <path
              d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14 21V10h5a1 1 0 0 1 1 1v10M3 21h18M7 9h3M7 13h3M7 17h3M17 14h.01M17 18h.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>

      <span className="leading-tight">
        <span className={`block text-[17px] font-extrabold tracking-tight ${text}`}>
          EaseMyOffice
        </span>
        <span
          className={`mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${sub}`}
        >
          <span className="inline-block h-1 w-1 rounded-full bg-gold" />
          KYC Verification
        </span>
      </span>
    </div>
  );
}
