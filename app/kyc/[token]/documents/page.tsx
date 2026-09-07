import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";
import { StepNav } from "@/components/steps/StepNav";
import { DocumentsUploader } from "@/components/steps/DocumentsUploader";

// Step 2 — Upload Aadhaar (front + back) and PAN.
export default async function DocumentsStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  return (
    <Card>
      <PortalHeader />
      <StepNav current="documents" />
      <h1 className="text-lg font-semibold text-slate-900">Upload Documents</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Upload clear photos of your Aadhaar card (front &amp; back) and PAN card.
        You can take a photo with your camera or choose a file.
      </p>
      <DocumentsUploader token={kase.token} />
    </Card>
  );
}
