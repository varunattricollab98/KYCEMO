"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";
import { ENTITY_LABELS, type EntityType, type KycCase } from "@/lib/types";
import { basicDetailsSchema } from "@/lib/validation";

export function BasicDetailsForm({ kase }: { kase: KycCase }) {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: kase.client_name,
    mobile: kase.mobile,
    email: kase.email,
    company_name: kase.company_name,
    entity_type: kase.entity_type as EntityType,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = basicDetailsSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${kase.token}/basic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      router.push(`/verify/${kase.token}/aadhaar`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Client Name">
        <input className={input} value={form.client_name} onChange={(e) => update("client_name", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile" hint="10-digit Indian mobile">
          <input className={input} value={form.mobile} inputMode="numeric" maxLength={10} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Email">
          <input className={input} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
      </div>
      <Field label="Business / Company Name">
        <input className={input} value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
      </Field>
      <Field label="Entity Type">
        <select className={input} value={form.entity_type} onChange={(e) => update("entity_type", e.target.value)}>
          {(Object.keys(ENTITY_LABELS) as EntityType[]).map((k) => (
            <option key={k} value={k}>{ENTITY_LABELS[k]}</option>
          ))}
        </select>
      </Field>

      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
        Location <b>{kase.vo_location}</b> · Plan <b>{kase.plan}</b> · Order <b>{kase.order_id}</b> (from your booking)
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Continue to Aadhaar →"}
      </Button>
    </form>
  );
}
