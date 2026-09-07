"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function AadhaarStart({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${token}/aadhaar/init`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start DigiLocker");
      // Redirect to DigiLocker (or the mock callback in dev).
      window.location.href = body.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" disabled={busy} onClick={start}>
        {busy ? "Redirecting…" : "Verify with DigiLocker →"}
      </Button>
    </div>
  );
}
