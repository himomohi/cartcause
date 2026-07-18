import { CheckCircle } from "@phosphor-icons/react";
import type { ApprovedFixRecord } from "./FixStudio";

interface ApprovedTrayProps {
  items: ApprovedFixRecord[];
}

export function ApprovedTray({ items }: ApprovedTrayProps) {
  return (
    <section
      aria-labelledby="approved-today-title"
      aria-live="polite"
      className="paper-panel p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Approved today</p>
          <h2
            id="approved-today-title"
            className="mt-2 text-lg font-semibold text-[var(--paper)]"
          >
            Tight list for the owner pass
          </h2>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--acid)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--acid)_16%,transparent)] px-3 text-sm font-semibold text-[var(--paper)]">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
          Approve a fix to stage it here. The tray stays compact so a founder can
          scan today&apos;s edits in one pass.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={`${item.leakId}:${item.title}`}
              className="flex items-start gap-3 rounded-[1.35rem] border border-white/8 bg-[var(--surface)] p-3"
            >
              <CheckCircle
                size={18}
                className="mt-1 shrink-0 text-[var(--acid)]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--paper)]">
                  {item.title}
                </p>
                <p className="mt-1 text-[0.78rem] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  {item.type.replace("_", " ")} for {item.productName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
