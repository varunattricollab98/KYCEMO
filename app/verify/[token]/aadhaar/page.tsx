import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card, Button } from "@/components/ui";
import { StepNav } from "@/components/steps/StepNav";
import { AadhaarStart } from "@/components/steps/AadhaarStart";

export default async function AadhaarStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  return (
    <Card>
      <StepNav current="aadhaar" />
      <h1 className="text-lg font-semibold text-slate-900">Aadhaar Verification</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        To comply with our client verification process, please verify your
        identity using DigiLocker (Aadhaar-based). You&apos;ll be redirected to
        DigiLocker to give consent and authenticate with an OTP.
      </p>
      <div className="mb-5 rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
        We receive only your <b>verified name, DOB and address</b> and a{" "}
        <b>masked Aadhaar (last 4 digits)</b>. Your full Aadhaar number is never
        stored.
      </div>
      <AadhaarStart token={kase.token} />
    </Card>
  );
}
