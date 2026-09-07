"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";
import { identifySchema } from "@/lib/validation";

// Step 1 form: Email + Contact number + Booking ID.
export function IdentifyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: "",
    email: "",
    mobile: "",
    booking_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = identifySchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/kyc/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start KYC");
      router.push(`/kyc/${body.token}/documents`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full Name">
        <input
          className={inputClass}
          type="text"
          placeholder="As per your Aadhaar / PAN"
          autoComplete="name"
          value={form.client_name}
          onChange={(e) => update("client_name", e.target.value)}
        />
      </Field>
      <Field label="Email ID">
        <input
          className={inputClass}
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>
      <Field label="Contact Number" hint="10-digit mobile">
        <input
          className={inputClass}
          inputMode="numeric"
          maxLength={10}
          placeholder="9876543210"
          value={form.mobile}
          onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <Field label="Booking ID" hint="From your booking / draft confirmation">
        <input
          className={inputClass}
          placeholder="EMO-XXXXXX"
          value={form.booking_id}
          onChange={(e) => update("booking_id", e.target.value.toUpperCase())}
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Starting…" : "Continue"}
        {!busy && <span aria-hidden>→</span>}
      </Button>
    </form>
  );
}
