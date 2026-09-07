import Link from "next/link";
import { notFound } from "next/navigation";
import { createStaffClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, Badge } from "@/components/ui";
import { StepTracker } from "@/components/StepTracker";
import { DecisionPanel } from "@/components/ops/DecisionPanel";
import { DOC_LABELS, type DocType, type StepKey, type StepStatus } from "@/lib/types";

type DocRow = {
  id: string;
  doc_type: DocType;
  storage_path: string | null;
  status: string;
};

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

  const [{ data: steps }, { data: docs }, { data: flags }, { data: audit }] =
    await Promise.all([
      supabase.from("kyc_steps").select("step,status").eq("case_id", params.id),
      supabase.from("documents").select("id,doc_type,storage_path,status").eq("case_id", params.id),
      supabase.from("case_flags").select("*").eq("case_id", params.id).eq("resolved", false),
      supabase.from("audit_log").select("action,step,created_at").eq("case_id", params.id).order("created_at", { ascending: false }).limit(20),
    ]);

  const statuses: Partial<Record<StepKey, StepStatus>> = {};
  (steps ?? []).forEach((s: { step: StepKey; status: StepStatus }) => {
    statuses[s.step] = s.status;
  });

  // Generate short-lived signed URLs for each uploaded file (service role).
  const admin = createAdminClient();
  const docRows = (docs as DocRow[] | null) ?? [];
  const signed = await Promise.all(
    docRows.map(async (d) => {
      if (!d.storage_path) return { ...d, url: null as string | null };
      const bucket = d.doc_type === "kyc_video" ? "kyc-video" : "kyc-documents";
      const { data } = await admin.storage
        .from(bucket)
        .createSignedUrl(d.storage_path, 60 * 30); // 30 min
      return { ...d, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to cases
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {kase.company_name || kase.email || "New KYC"}
          </h1>
          <p className="text-sm text-slate-500">Booking {kase.order_id}</p>
        </div>
        <Badge tone="amber">{String(kase.status).replace(/_/g, " ")}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Client (from Step 1)</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400">Email</dt><dd>{kase.email || "—"}</dd></div>
              <div><dt className="text-slate-400">Contact</dt><dd>{kase.mobile || "—"}</dd></div>
              <div><dt className="text-slate-400">Booking ID</dt><dd>{kase.order_id}</dd></div>
              {kase.company_name && (
                <div><dt className="text-slate-400">Company</dt><dd>{kase.company_name}</dd></div>
              )}
            </dl>
            <p className="mt-3 text-xs text-slate-400">
              Name, company, designation &amp; location are stated by the client in the
              video KYC.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Uploaded documents &amp; video</h2>
            {signed.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing uploaded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {signed.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <span className="font-medium text-slate-700">
                      {DOC_LABELS[d.doc_type] ?? d.doc_type}
                    </span>
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        {d.doc_type === "kyc_video" ? "▶ View video" : "View / download"}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">no file</span>
                    )}
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
