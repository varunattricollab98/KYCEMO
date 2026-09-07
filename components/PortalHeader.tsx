import { ENTITY_LABELS, type KycCase } from "@/lib/types";
import { Badge } from "./ui";

export function PortalHeader({ kase }: { kase: Pick<KycCase, "client_name" | "company_name" | "entity_type" | "vo_location" | "plan" | "order_id"> }) {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-brand-dark">EaseMyOffice</span>
        <Badge tone="blue">KYC Verification</Badge>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-slate-400">Client</span><div className="font-medium text-slate-800">{kase.client_name}</div></div>
          <div><span className="text-slate-400">Company</span><div className="font-medium text-slate-800">{kase.company_name}</div></div>
          <div><span className="text-slate-400">Entity</span><div className="font-medium text-slate-800">{ENTITY_LABELS[kase.entity_type]}</div></div>
          <div><span className="text-slate-400">Location</span><div className="font-medium text-slate-800">{kase.vo_location}</div></div>
          <div><span className="text-slate-400">Plan</span><div className="font-medium text-slate-800">{kase.plan}</div></div>
          <div><span className="text-slate-400">Order</span><div className="font-medium text-slate-800">{kase.order_id}</div></div>
        </div>
      </div>
    </header>
  );
}
