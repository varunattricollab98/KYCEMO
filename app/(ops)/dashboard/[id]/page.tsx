import Link from "next/link";
import { notFound } from "next/navigation";
import { createStaffClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { StepTracker } from "@/components/StepTracker";
import { DecisionPanel } from "@/components/ops/DecisionPanel";
import {
  ENTITY_LABELS,
  DOC_LABELS,
  type DocType,
  type EntityType,
  type StepKey,
  type StepStatus,
} from "@/lib/types";

export default async function CaseDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createStaffClient();

  const { data: kase } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!kase) notFound();

  const [{ data: steps }, { data: idv }, { data: docs }, { data: flags }, { data: audit }] =
    await Promise.all([
      supabase.from("kyc_steps").select("step,status").eq("case_id", params.id),
      supabase.from("identity_verifications").select("*").eq("case_id", params.id),
      supabase.from("documents").select("*").eq("case_id", params.id),
      supabase.from("case_flags").select("*").eq("case_id", params.id).eq("resolved", false),
      supabase.from("audit_log").select("action,step,created_at").eq("case_id", params.id).order("created_at", { ascending: false }).limit(20),
    ]);

  const statuses: Partial<Record<StepKey, StepStatus>> = {};
  (steps ?? []).forEach((s: { step: StepKey; status: StepStatus }) => {
    statuses[s.step] = s.status;
  });

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to cases
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{kase.company_name}</h1>
          <p className="text-sm text-slate-500">
            {ENTITY_LABELS[kase.entity_type as EntityType]} · Order {kase.order_id}
          </p>
        </div>
        <Badge tone="amber">{String(kase.status).replace(/_/g, " ")}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Client</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400">Name</dt><dd>{kase.client_name}</dd></div>
              <div><dt className="text-slate-400">Mobile</dt><dd>{kase.mobile} {kase.mobile_verified ? "✓" : ""}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd>{kase.email}</dd></div>
              <div><dt className="text-slate-400">Location</dt><dd>{kase.vo_location}</dd></div>
              <div><dt className="text-slate-400">Plan</dt><dd>{kase.plan}</dd></div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Identity verification</h2>
            {(idv ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No verification yet.</p>
            ) : (
              (idv ?? []).map((v: Record<string, unknown>) => (
                <div key={String(v.id)} className="mb-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="font-medium">{String(v.kind)} · {String(v.result)}</div>
                  <div className="text-slate-500">
                    {v.verified_name ? `Verified name: ${String(v.verified_name)}` : ""}
                    {v.aadhaar_last4 ? ` · Aadhaar ••••${String(v.aadhaar_last4)}` : ""}
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Documents</h2>
            {(docs ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded (may be via email).</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(docs ?? []).map((d: Record<string, unknown>) => (
                  <li key={String(d.id)} className="flex justify-between">
                    <span>{DOC_LABELS[d.doc_type as DocType] ?? String(d.doc_type)}</span>
                    <span className="text-slate-400">{String(d.status)} · {String(d.source)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Audit trail</h2>
            <ul className="space-y-1 text-xs text-slate-500">
              {(audit ?? []).map((a: Record<string, unknown>, i) => (
                <li key={i}>
                  {new Date(String(a.created_at)).toLocaleString()} — {String(a.action)}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Progress</h2>
            <StepTracker statuses={statuses} />
          </Card>

          {(flags ?? []).length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-red-700">🚨 Flags</h2>
              <ul className="space-y-1 text-sm text-red-700">
                {(flags ?? []).map((f: Record<string, unknown>) => (
                  <li key={String(f.id)}>{String(f.flag).replace(/_/g, " ")} ({String(f.severity)})</li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Decision</h2>
            <DecisionPanel caseId={kase.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
