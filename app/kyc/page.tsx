import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";
import { IdentifyForm } from "@/components/steps/IdentifyForm";

// Step 1 — Identify. Public landing (the link is sent to the client after
// draft confirmation). We only collect enough to tie the KYC to their booking.
export default function KycStart() {
  return (
    <Card>
      <PortalHeader />
      <h1 className="text-xl font-semibold text-slate-900">
        Complete Your EaseMyOffice KYC
      </h1>
      <p className="mb-1 mt-2 text-sm text-slate-600">
        Please complete your KYC to activate your Virtual Office service. Keep
        your <b>Aadhaar</b> and <b>PAN</b> cards ready — you&apos;ll upload them and
        record a short video. Takes about 3–4 minutes.
      </p>
      <div className="my-4 rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
        By continuing you consent to EaseMyOffice collecting your Aadhaar &amp;
        PAN documents and a short verification video for client onboarding and
        compliance.
      </div>
      <IdentifyForm />
    </Card>
  );
}
