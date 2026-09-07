import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card } from "@/components/ui";
import { StepNav } from "@/components/steps/StepNav";
import { VideoKycStart } from "@/components/steps/VideoKycStart";
import { verificationSubjectRole } from "@/lib/types";

export default async function VideoStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  const role = verificationSubjectRole(kase.entity_type);

  return (
    <Card>
      <StepNav current="video" />
      <h1 className="text-lg font-semibold text-slate-900">Video KYC Required</h1>
      <p className="mb-3 mt-1 text-sm text-slate-600">
        Please complete a short video verification to confirm your identity and
        authorisation. For your entity type, the person to verify is the{" "}
        <b>{role}</b>.
      </p>
      <ul className="mb-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <li>• Your original ID</li>
        <li>• Good lighting</li>
        <li>• Camera &amp; microphone access</li>
        <li>• A stable internet connection</li>
      </ul>
      <VideoKycStart token={kase.token} />
    </Card>
  );
}
