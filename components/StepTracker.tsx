import { STEP_ORDER, STEP_LABELS, type StepKey, type StepStatus } from "@/lib/types";

const ICON: Record<StepStatus, string> = {
  completed: "✓",
  in_progress: "⏳",
  failed: "✕",
  pending: "○",
  skipped: "–",
};

const COLOR: Record<StepStatus, string> = {
  completed: "text-green-600",
  in_progress: "text-amber-600",
  failed: "text-red-600",
  pending: "text-slate-300",
  skipped: "text-slate-400",
};

export function StepTracker({
  statuses,
}: {
  statuses: Partial<Record<StepKey, StepStatus>>;
}) {
  return (
    <ol className="space-y-3">
      {STEP_ORDER.map((step) => {
        const s = statuses[step] ?? "pending";
        return (
          <li key={step} className="flex items-center gap-3">
            <span className={`text-lg font-bold ${COLOR[s]}`}>{ICON[s]}</span>
            <span
              className={
                s === "pending" ? "text-slate-400" : "text-slate-800"
              }
            >
              {STEP_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
