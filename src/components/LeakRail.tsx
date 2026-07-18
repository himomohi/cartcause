import { ArrowUpRight, Receipt, TrendUp } from "@phosphor-icons/react";
import {
  basisPointsToPercent,
  centsToCurrency,
  confidenceTone,
  percentDeltaLabel,
  type MergedLeak,
} from "../data/cartCause";
import { StatusPill } from "./StatusPill";

interface LeakRailProps {
  leaks: MergedLeak[];
  selectedLeakId: string;
  onSelect: (leakId: string) => void;
  dataLabel: string;
}

export function LeakRail({
  leaks,
  selectedLeakId,
  onSelect,
  dataLabel,
}: LeakRailProps) {
  return (
    <section
      id="leak-candidates"
      aria-labelledby="leak-rail-title"
      className="paper-panel flex h-full flex-col gap-4 p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Leak rail</p>
          <h2
            id="leak-rail-title"
            className="mt-2 text-lg font-semibold text-[var(--paper)]"
          >
            Ranked candidates
          </h2>
        </div>
        <StatusPill tone="muted">{dataLabel}</StatusPill>
      </div>

      <ol
        role="tablist"
        aria-label="Leak candidates"
        className="flex flex-col gap-3"
      >
        {leaks.map((leak, index) => {
          const isSelected = leak.id === selectedLeakId;
          const confidence = confidenceTone[leak.analysis.confidence];

          return (
            <li key={leak.id} role="presentation">
              <button
                id={`leak-tab-${leak.id}`}
                type="button"
                role="tab"
                onClick={() => onSelect(leak.id)}
                onKeyDown={(event) => {
                  const keyOffsets: Record<string, number> = {
                    ArrowDown: 1,
                    ArrowRight: 1,
                    ArrowUp: -1,
                    ArrowLeft: -1,
                  };

                  let nextIndex: number | null = null;

                  if (event.key === "Home") {
                    nextIndex = 0;
                  } else if (event.key === "End") {
                    nextIndex = leaks.length - 1;
                  } else if (event.key in keyOffsets) {
                    nextIndex =
                      (index + keyOffsets[event.key] + leaks.length) % leaks.length;
                  }

                  if (nextIndex === null) {
                    return;
                  }

                  event.preventDefault();
                  const nextLeak = leaks[nextIndex];
                  if (!nextLeak) {
                    return;
                  }

                  onSelect(nextLeak.id);
                  window.requestAnimationFrame(() => {
                    document.getElementById(`leak-tab-${nextLeak.id}`)?.focus();
                  });
                }}
                className={[
                  "group w-full rounded-[1.35rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]",
                  isSelected
                    ? "border-[color:color-mix(in_srgb,var(--coral)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_10%,var(--ink))] shadow-[0_18px_40px_rgba(4,7,11,0.35)]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                ].join(" ")}
                aria-selected={isSelected}
                aria-controls={`leak-panel-${leak.id}`}
                tabIndex={isSelected ? 0 : -1}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                        #{leak.analysis.rank}
                      </span>
                      <StatusPill tone={isSelected ? "signal" : "muted"}>
                        {leak.product.sku}
                      </StatusPill>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--paper)]">
                        {leak.product.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                        {leak.analysis.headline}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className={[
                      "mt-1 shrink-0 transition",
                      isSelected
                        ? "text-[var(--paper)]"
                        : "text-[var(--ink-soft)] group-hover:text-[var(--paper)]",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--ink-soft)]">
                  <div className="rounded-2xl border border-white/8 bg-[var(--surface)] p-3">
                    <dt className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em]">
                      <Receipt size={14} aria-hidden="true" />
                      Leakage
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-[var(--paper)]">
                      {centsToCurrency(leak.computed.estimatedLeakageCents)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[var(--surface)] p-3">
                    <dt className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em]">
                      <TrendUp size={14} aria-hidden="true" />
                      Return delta
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-[var(--paper)]">
                      {percentDeltaLabel(
                        leak.computed.returnRateBps,
                        leak.computed.baselineReturnRateBps,
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill tone={isSelected ? "signal" : "muted"}>
                    {basisPointsToPercent(leak.computed.returnRateBps)} return rate
                  </StatusPill>
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]",
                      confidence.className,
                    ].join(" ")}
                  >
                    {confidence.label}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
