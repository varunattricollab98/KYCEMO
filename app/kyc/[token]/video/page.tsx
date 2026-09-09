import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";
import { StepNav } from "@/components/steps/StepNav";
import { VideoRecorder } from "@/components/steps/VideoRecorder";
import { VIDEO_KYC_SCRIPT } from "@/lib/types";

// Step 3 — Video KYC. Client records themselves reading the script while
// showing their Aadhaar & PAN cards to the camera.
export default async function VideoStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  return (
    <Card>
      <PortalHeader />
      <StepNav current="video" />
      <h1 className="text-xl font-bold tracking-tight text-navy">Video KYC</h1>
      <p className="mb-4 mt-1.5 text-sm leading-relaxed text-slate-500">
        Record a short video (up to 60 seconds) reading the script below. Hold
        your <b className="text-navy">Aadhaar</b> and{" "}
        <b className="text-navy">PAN</b> cards up to the camera when you mention
        them.
      </p>
      <VideoRecorder token={kase.token} script={VIDEO_KYC_SCRIPT} maxSeconds={60} />
    </Card>
  );
}
