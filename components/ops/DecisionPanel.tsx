"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type Decision = "approve" | "reject" | "re_kyc";

export function DecisionPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(decision: Decision) {
    if ((decision === "reject" || decision === "re_kyc") && !reason.trim()) {
      setError("Please add a reason.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/ops/cases/${caseId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full rounded-xl border border-slate-200 p-2 text-sm outline-none focus:border-brand"
        rows={3}
        placeholder="Reason (required for reject / re-KYC)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2">
        <Button onClick={() => act("approve")} disabled={busy !== null}>
          {busy === "approve" ? "Approving…" : "Approve"}
        </Button>
        <Button variant="ghost" onClick={() => act("re_kyc")} disabled={busy !== null}>
          {busy === "re_kyc" ? "…" : "Request Re-KYC"}
        </Button>
        <Button variant="danger" onClick={() => act("reject")} disabled={busy !== null}>
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
