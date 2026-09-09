import { Logo } from "./Logo";

// Header shown on every step of the client KYC flow.
export function PortalHeader() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <Logo />
      <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Secure &amp; encrypted
      </span>
    </header>
  );
}
