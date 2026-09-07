import { loadUsableCase } from "@/lib/cases";
import { Card, Button } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";

// Landing / Screen 0. Server component: validates the token and shows the
// prefilled context so the client trusts the link before starting.
export default async function Landing({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);

  if (!kase) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-slate-900">Link unavailable</h1>
        <p className="mt-2 text-slate-600">
          This KYC link is invalid, has expired, or the verification is already
          submitted. Please contact EaseMyOffice support for a fresh link.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <PortalHeader kase={kase} />
      <h1 className="text-xl font-semibold text-slate-900">
        Complete Your EaseMyOffice KYC
      </h1>
      <p className="mt-2 text-slate-600">
        Your KYC is required to activate your Virtual Office service. Please keep
        your Aadhaar and company / firm documents ready.
      </p>
      <p className="mt-2 text-sm text-slate-500">Estimated time: 5–7 minutes</p>

      <div className="mt-4 rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
        By continuing you consent to EaseMyOffice verifying your identity via
        DigiLocker (Aadhaar), a short video verification, and reviewing the
        documents you provide, for client onboarding and compliance.
      </div>

      <div className="mt-6">
        <Button href={`/verify/${params.token}/basic`}>Start KYC →</Button>
      </div>
    </Card>
  );
}
