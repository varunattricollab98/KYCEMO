import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-radial text-white">
      {/* ambient accents */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-up">
          <div className="mb-8 flex justify-center">
            <Logo variant="light" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Secure client verification
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Complete your KYC in
            <br />
            <span className="bg-gradient-to-r from-gold-400 to-gold bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Enter your details, upload your Aadhaar &amp; PAN, and record a short
            verification video. It takes about 3–4 minutes.
          </p>

          <div className="mt-8">
            <Link
              href="/kyc"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3.5 text-sm font-semibold text-navy shadow-glow transition hover:bg-gold-400 active:scale-[.99]"
            >
              Start your KYC <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-white/50">
            <span>🔒 Encrypted</span>
            <span>🇮🇳 Made for India</span>
            <span>⚡ ~4 minutes</span>
          </div>
        </div>
      </div>
    </main>
  );
}
