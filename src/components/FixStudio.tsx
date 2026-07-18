import { CheckCircle, Copy, Sparkle, XCircle } from "@phosphor-icons/react";
import type { RecommendedFix, MergedLeak } from "../data/cartCause";
import { StatusPill } from "./StatusPill";

export interface ApprovedFixRecord {
  leakId: string;
  productName: string;
  title: string;
  type: RecommendedFix["type"];
}

interface FixStudioProps {
  leak: MergedLeak;
  approvedTitles: string[];
  onApprove: (fix: RecommendedFix) => void;
  onReject: (fix: RecommendedFix) => void;
  onCopyBrief: () => void;
  isCopying: boolean;
}

export function FixStudio({
  leak,
  approvedTitles,
  onApprove,
  onReject,
  onCopyBrief,
  isCopying,
}: FixStudioProps) {
  const approvedSet = new Set(approvedTitles);

  return (
    <section
      aria-labelledby="fix-studio-title"
      className="paper-panel flex h-full flex-col gap-4 p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Fix Studio</p>
          <h2
            id="fix-studio-title"
            className="mt-2 text-lg font-semibold text-[var(--paper)]"
          >
            Approve-ready fixes
          </h2>
        </div>
        <StatusPill tone="success">{approvedSet.size} approved</StatusPill>
      </div>

      <button
        type="button"
        onClick={onCopyBrief}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--coral)_48%,transparent)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(254,137,111,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
      >
        <Copy size={18} aria-hidden="true" />
        {isCopying ? "Copied brief" : "Copy implementation brief"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {isCopying ? "Implementation brief copied to the clipboard." : ""}
      </span>

      <ol className="space-y-4">
        {leak.analysis.recommended_fixes.map((fix) => {
          const isApproved = approvedSet.has(fix.title);

          return (
            <li
              key={fix.title}
              className="rounded-[1.5rem] border border-white/8 bg-[var(--surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={isApproved ? "success" : "muted"}>
                      {fix.type.replace("_", " ")}
                    </StatusPill>
                    {isApproved ? (
                      <StatusPill tone="success">Approved</StatusPill>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--paper)]">
                    {fix.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {fix.rationale}
                  </p>
                </div>
                <Sparkle
                  size={18}
                  className="mt-1 shrink-0 text-[var(--coral)]"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.25rem] border border-white/8 bg-black/10 p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                    Before
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--paper)]/85">
                    {fix.before}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--acid)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--acid)_9%,transparent)] p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                    After
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--paper)]">
                    {fix.after}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(fix)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--acid)_42%,transparent)] bg-[color:color-mix(in_srgb,var(--acid)_16%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition hover:bg-[color:color-mix(in_srgb,var(--acid)_22%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acid)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                >
                  <CheckCircle size={18} aria-hidden="true" />
                  Approve fix
                </button>
                <button
                  type="button"
                  onClick={() => onReject(fix)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-white/20 hover:text-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                >
                  <XCircle size={18} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
