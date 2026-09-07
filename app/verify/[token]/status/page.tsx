import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui";
import { StepTracker } from "@/components/StepTracker";
import type { KycStep, StepKey, StepStatus } from "@/lib/types";

// Status screen. Reads the case (allowing a `submitted` token, since the
// client should still see status after finishing) and renders the tracker.
export default async function StatusStep({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createAdminClient();
  const { data: kase } = await supabase
    .from("kyc_cases")
    .select("id, status")
    .eq("token", params.token)
    .maybeSingle();

  if (!kase) notFound();

  const { data: steps } = await supabase
    .from("kyc_steps")
    .select("step, status")
    .eq("case_id", kase.id);

  const statuses: Partial<Record<StepKey, StepStatus>> = {};
  (steps as Pick<KycStep, "step" | "status">[] | null)?.forEach((s) => {
    statuses[s.step] = s.status;
  });

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">KYC Status</h1>
      <p className="mb-5 mt-1 text-sm text-slate-600">
        Your KYC has been submitted successfully. Our compliance team will
        review your information and documents.
      </p>
      <StepTracker statuses={statuses} />
      <p className="mt-6 text-xs text-slate-400">
        You can revisit this link anytime to check your latest KYC status.
        Order status: <b className="text-slate-600">{kase.status}</b>
      </p>
    </Card>
  );
}
