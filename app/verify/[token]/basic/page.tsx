import { notFound } from "next/navigation";
import { loadUsableCase } from "@/lib/cases";
import { Card } from "@/components/ui";
import { StepNav } from "@/components/steps/StepNav";
import { BasicDetailsForm } from "@/components/steps/BasicDetailsForm";

export default async function BasicStep({
  params,
}: {
  params: { token: string };
}) {
  const kase = await loadUsableCase(params.token);
  if (!kase) notFound();

  return (
    <Card>
      <StepNav current="basic" />
      <h1 className="text-lg font-semibold text-slate-900">Basic Details</h1>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        We&apos;ve prefilled this from your booking. Please confirm or correct.
      </p>
      <BasicDetailsForm kase={kase} />
    </Card>
  );
}
