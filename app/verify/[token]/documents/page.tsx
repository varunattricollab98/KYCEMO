import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card } from "@/components/ui";
import { StepNav } from "@/components/steps/StepNav";
import { DocumentsUploader } from "@/components/steps/DocumentsUploader";
import { requiredDocuments } from "@/lib/types";

export default async function DocumentsStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  const docs = requiredDocuments(kase.entity_type);

  return (
    <Card>
      <StepNav current="documents" />
      <h1 className="text-lg font-semibold text-slate-900">Documents Required</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Please upload the documents below. Already emailed them to us? You can
        skip uploading — our team will mark them received.
      </p>
      <DocumentsUploader token={kase.token} docTypes={docs} />
    </Card>
  );
}
