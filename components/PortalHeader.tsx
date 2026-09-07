import { Badge } from "./ui";

// Simple portal header shown on every step of the client KYC flow.
export function PortalHeader() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <span className="text-lg font-semibold text-brand-dark">EaseMyOffice</span>
      <Badge tone="blue">KYC Verification</Badge>
    </header>
  );
}
