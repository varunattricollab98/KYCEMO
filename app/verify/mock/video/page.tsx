import { Card, Button } from "@/components/ui";

// Dev-only mock Video KYC screen. In production this URL is the provider's
// hosted VCIP session. Here it just lets you simulate completion and bounce
// back to the documents step.
export default function MockVideo({
  searchParams,
}: {
  searchParams: { case?: string; role?: string };
}) {
  const role = searchParams.role ?? "Authorised signatory";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-8">
      <Card>
        <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
          Mock Video KYC (dev)
        </span>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Video verification
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          In production this is the provider&apos;s hosted session (face → ID →
          liveness → verification → recording). Verifying: <b>{role}</b>.
        </p>
        <div className="my-5 flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-slate-400">
          📷 camera preview
        </div>
        <p className="text-xs text-slate-400">
          Use the back button in your real flow — completion is driven by the
          provider webhook (<code>/video/webhook</code>).
        </p>
        <div className="mt-4">
          <Button href="/" variant="ghost">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
