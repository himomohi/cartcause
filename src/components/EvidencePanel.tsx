import { Quotes, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import {
  basisPointsToPercent,
  confidenceTone,
  evidenceTypeLabels,
  percentDeltaLabel,
  type MergedLeak,
} from "../data/cartCause";
import { StatusPill } from "./StatusPill";

interface EvidencePanelProps {
  leak: MergedLeak;
}

export function EvidencePanel({ leak }: EvidencePanelProps) {
  const confidence = confidenceTone[leak.analysis.confidence];

  return (
    <section
      id={`leak-panel-${leak.id}`}
      role="tabpanel"
      aria-labelledby={`leak-tab-${leak.id}`}
      className="paper-panel flex h-full flex-col gap-6 p-5 md:p-6"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Evidence view</p>
          <h2
            id={`evidence-title-${leak.id}`}
            className="mt-2 text-2xl font-semibold text-[var(--paper)]"
          >
            {leak.analysis.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
            {leak.analysis.cause_hypothesis}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill tone="signal">{leak.product.sku}</StatusPill>
          <span
            className={[
              "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]",
              confidence.className,
            ].join(" ")}
          >
            {confidence.label}
          </span>
        </div>
      </header>

      <dl className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.6rem] border border-white/8 bg-[var(--surface)] p-4">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Return rate
          </dt>
          <dd className="mt-3 text-2xl font-semibold text-[var(--paper)]">
            {basisPointsToPercent(leak.computed.returnRateBps)}
          </dd>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Versus baseline{" "}
            {basisPointsToPercent(leak.computed.baselineReturnRateBps)}.
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-white/8 bg-[var(--surface)] p-4">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Gap to baseline
          </dt>
          <dd className="mt-3 text-2xl font-semibold text-[var(--paper)]">
            {percentDeltaLabel(
              leak.computed.returnRateBps,
              leak.computed.baselineReturnRateBps,
            )}
          </dd>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Computed locally from sample store data.
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-white/8 bg-[var(--surface)] p-4">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Cases reviewed
          </dt>
          <dd className="mt-3 text-2xl font-semibold text-[var(--paper)]">
            {leak.computed.returns}
          </dd>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            From {leak.computed.orders} sample orders in this cluster.
          </p>
        </div>
      </dl>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-[1.6rem] border border-white/8 bg-[var(--paper)]/95 p-4 text-[var(--ink)] shadow-[0_18px_40px_rgba(7,7,10,0.18)]">
          <div className="flex items-center gap-3">
            <Quotes size={18} className="text-[var(--coral)]" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
              Evidence excerpts
            </h3>
          </div>

          <ul className="mt-4 space-y-3">
            {leak.evidence.map((item) => {
              const isReferenced = leak.analysis.evidence_refs.includes(item.id);

              return (
                <li
                  key={item.id}
                  className={[
                    "rounded-[1.3rem] border p-4",
                    isReferenced
                      ? "border-[color:color-mix(in_srgb,var(--coral)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--coral)_9%,white)]"
                      : "border-black/8 bg-black/[0.02]",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={isReferenced ? "signal" : "muted"}>
                      {item.id}
                    </StatusPill>
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                      {evidenceTypeLabels[item.type]}
                    </span>
                    <span className="text-[0.78rem] text-[var(--ink-muted)]">
                      {item.sourceLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.96rem] leading-7 text-[var(--ink)]">
                    {item.excerpt}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.6rem] border border-white/8 bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[var(--acid)]" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                Current copy
              </h3>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--paper)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  Description
                </p>
                <p className="mt-2">{leak.currentCopy.description}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  FAQ
                </p>
                <p className="mt-2">{leak.currentCopy.faq}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--coral)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--coral)_10%,transparent)] p-4">
            <div className="flex items-center gap-3">
              <WarningCircle
                size={18}
                className="text-[var(--paper)]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)]">
                What not to claim
              </h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--paper)]/88">
              {leak.analysis.what_not_to_claim}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
