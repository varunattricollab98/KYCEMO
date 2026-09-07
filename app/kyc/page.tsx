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
      <div className="my-5 grid grid-cols-3 gap-2">
        {[
          { n: "1", t: "Your details" },
          { n: "2", t: "Upload docs" },
          { n: "3", t: "Video KYC" },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center"
          >
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
              {s.n}
            </div>
            <div className="text-[11px] font-medium text-slate-500">{s.t}</div>
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
