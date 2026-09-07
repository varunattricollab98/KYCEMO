import { STEP_LABELS, type StepKey } from "@/lib/types";

// Compact 3-step progress indicator shown at the top of each step screen.
const CLIENT_STEPS: StepKey[] = ["identify", "documents", "video"];

export function StepNav({ current }: { current: StepKey }) {
  const idx = CLIENT_STEPS.indexOf(current);
  return (
    <div className="mb-5 flex items-center gap-1.5">
      {CLIENT_STEPS.map((s, i) => (
        <div key={s} className="flex-1">
          <div
            className={`h-1.5 rounded-full ${
              i <= idx ? "bg-brand" : "bg-slate-200"
            }`}
          />
        </div>
      ))}
      <span className="ml-2 whitespace-nowrap text-xs font-medium text-slate-500">
        Step {idx + 1} of 3 · {STEP_LABELS[current]}
      </span>
    </div>
  );
}
