import Link from "next/link";
import { createStaffClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import type { StepKey, StepStatus } from "@/lib/types";

type CaseRow = {
  id: string;
  order_id: string;
  company_name: string;
  email: string;
  mobile: string;
  status: string;
  kyc_steps: { step: StepKey; status: StepStatus }[];
  case_flags: { flag: string; resolved: boolean; severity: string }[];
};

function StepCell({ status }: { status?: StepStatus }) {
  if (status === "completed") return <span className="text-green-600">✓</span>;
  if (status === "failed") return <span className="text-red-600">✕</span>;
  if (status === "in_progress") return <span className="text-amber-600">⏳</span>;
  return <span className="text-slate-300">○</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "green"
      : status === "rejected"
        ? "red"
        : status === "under_review" || status === "submitted"
          ? "amber"
          : "slate";
  return <Badge tone={tone as never}>{status.replace(/_/g, " ")}</Badge>;
}

export default async function CasesPage() {
  const supabase = createStaffClient();
  const { data, error } = await supabase
    .from("kyc_cases")
    .select(
      "id, order_id, company_name, email, mobile, status, kyc_steps(step,status), case_flags(flag,resolved,severity)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const cases = (data as CaseRow[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">KYC Cases</h1>
        <span className="text-sm text-slate-400">{cases.length} shown</span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3 text-center">Documents</th>
              <th className="px-4 py-3 text-center">Video KYC</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => {
              const step = (k: StepKey) =>
                c.kyc_steps?.find((s) => s.step === k)?.status;
              const flags = (c.case_flags ?? []).filter((f) => !f.resolved);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/${c.id}`} className="font-medium text-brand hover:underline">
                      {c.company_name || c.email || "(new)"}
                    </Link>
                    <div className="text-xs text-slate-400">{c.mobile}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.order_id}</td>
                  <td className="px-4 py-3 text-center"><StepCell status={step("documents")} /></td>
                  <td className="px-4 py-3 text-center"><StepCell status={step("video")} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {flags.length === 0 ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span title={flags.map((f) => f.flag).join(", ")}>
                        🚨 {flags.length}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {cases.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No KYC cases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
