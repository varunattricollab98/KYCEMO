import { Card } from "@/components/ui";
import { PortalHeader } from "@/components/PortalHeader";

// Confirmation screen shown after the client submits their KYC.
export default function Done() {
  return (
    <Card>
      <PortalHeader />
      <div className="py-4 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
          ✓
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          KYC submitted successfully
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          Thank you! We&apos;ve received your documents and video. Our team will
          verify your KYC and update you shortly. You can now close this page.
        </p>
      </div>
    </Card>
  );
}
