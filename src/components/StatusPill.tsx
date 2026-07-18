import type { ReactNode } from "react";

interface StatusPillProps {
  children: ReactNode;
  tone?: "default" | "signal" | "success" | "error" | "muted";
}

const toneClasses: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  default: "border-white/10 bg-white/6 text-[var(--paper)]",
  signal:
    "border-[color:color-mix(in_srgb,var(--coral)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--coral)_16%,transparent)] text-[var(--paper)]",
  success:
    "border-[color:color-mix(in_srgb,var(--acid)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--acid)_16%,transparent)] text-[var(--paper)]",
  error: "border-red-400/30 bg-red-500/14 text-[var(--paper)]",
  muted: "border-white/8 bg-white/[0.03] text-[var(--ink-soft)]",
};

export function StatusPill({
  children,
  tone = "default",
}: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em]",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
