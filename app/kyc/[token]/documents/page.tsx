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
      <h1 className="text-xl font-bold tracking-tight text-navy">
        Upload your documents
      </h1>
      <p className="mb-5 mt-1.5 text-sm leading-relaxed text-slate-500">
        Clear photos of your <b className="text-navy">Aadhaar</b> (front &amp;
        back) and <b className="text-navy">PAN</b> card. Snap with your camera or
        pick a file.
      </p>
      <DocumentsUploader token={kase.token} />
    </Card>
  );
}
