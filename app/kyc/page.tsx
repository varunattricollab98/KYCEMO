import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";
import { IdentifyForm } from "@/components/steps/IdentifyForm";

// Step 1 — Identify. Public landing (the link is sent to the client after
// draft confirmation). We only collect enough to tie the KYC to their booking.
export default function KycStart() {
  return (
    <Card>
      <PortalHeader />

      <h1 className="text-2xl font-bold tracking-tight text-navy">
        Complete your KYC
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        A quick 3-step verification to activate your Virtual Office service.
        Keep your <b className="text-navy">Aadhaar</b> and{" "}
        <b className="text-navy">PAN</b> cards ready.
      </p>

      {/* What you'll do — sets expectations */}
      <div className="my-5 grid grid-cols-3 gap-2.5">
        {[
          { n: "1", t: "Your details", i: "📝" },
          { n: "2", t: "Upload docs", i: "🪪" },
          { n: "3", t: "Video KYC", i: "🎥" },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-3 text-center shadow-soft"
          >
            <div className="text-lg">{s.i}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-brand">{s.n}.</span> {s.t}
            </div>
          </div>
        ))}
      </div>

      <IdentifyForm />

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
        <span className="mt-0.5">🛡️</span>
        By continuing you consent to EaseMyOffice collecting your Aadhaar &amp;
        PAN documents and a short verification video for onboarding and
        compliance.
      </p>
    </Card>
  );
}
