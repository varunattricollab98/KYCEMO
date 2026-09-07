import { STEP_LABELS, type StepKey } from "@/lib/types";

// 3-step progress indicator with numbered nodes + connecting track.
const CLIENT_STEPS: StepKey[] = ["identify", "documents", "video"];

export function StepNav({ current }: { current: StepKey }) {
  const idx = CLIENT_STEPS.indexOf(current);
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {CLIENT_STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "bg-brand text-white"
                      : active
                        ? "bg-brand-gradient text-white shadow-glow ring-4 ring-brand-500/15"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
              </div>
              {i < CLIENT_STEPS.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-brand transition-all duration-500 ${
                      i < idx ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-500">
        Step {idx + 1} of 3 · {STEP_LABELS[current]}
      </p>
    </div>
  );
}
