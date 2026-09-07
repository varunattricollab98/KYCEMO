import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-radial text-white">
      {/* ambient accents */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />
      {/* subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(circle at 50% 35%, black, transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-up">
          <div className="mb-9 flex justify-center">
            <Logo variant="light" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Secure client verification
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Complete your KYC in
            <br />
            <span className="bg-gradient-to-r from-gold-400 via-gold to-gold-400 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            Enter your details, upload your Aadhaar &amp; PAN, and record a short
            verification video. It takes about 3–4 minutes.
          </p>

          {/* the 3 steps as glass chips */}
          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { i: "📝", t: "Your details" },
              { i: "🪪", t: "Upload docs" },
              { i: "🎥", t: "Video KYC" },
            ].map((s, idx) => (
              <div
                key={s.t}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-4 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="text-xl">{s.i}</div>
                <div className="mt-1.5 text-[11px] font-medium text-white/70">
                  <span className="text-gold">{idx + 1}.</span> {s.t}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9">
            <Link
              href="/kyc"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-8 py-4 text-sm font-bold text-navy shadow-glow transition-all hover:bg-gold-400 hover:shadow-[0_10px_40px_-8px_rgba(245,158,11,.55)] active:scale-[.98]"
            >
              Start your KYC
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-5 text-xs text-white/45">
            <span className="flex items-center gap-1.5">🔒 Encrypted</span>
            <span className="h-3 w-px bg-white/15" />
            <span className="flex items-center gap-1.5">🇮🇳 Made for India</span>
            <span className="h-3 w-px bg-white/15" />
            <span className="flex items-center gap-1.5">⚡ ~4 minutes</span>
          </div>
        </div>
      </div>
    </main>
  );
}
