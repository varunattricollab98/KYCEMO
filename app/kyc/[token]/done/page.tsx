import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";

// Confirmation screen shown after the client submits their KYC.
export default function Done() {
  return (
    <Card>
      <PortalHeader />
      <div className="py-6 text-center">
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-glow">
            ✓
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-navy">
          KYC submitted successfully
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Thank you! We&apos;ve received your documents and video. Our team will
          verify your KYC and reach out with the next steps. You can close this
          page now.
        </p>

        <div className="mx-auto mt-6 max-w-xs space-y-2 text-left">
          {["Details received", "Documents received", "Video KYC received"].map(
            (t) => (
              <div
                key={t}
                className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-sm font-medium text-navy"
              >
                <span className="text-emerald-500">✓</span> {t}
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
