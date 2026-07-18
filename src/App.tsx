import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  ChartLine,
  ClockCountdown,
  Flask,
  Package,
  Sparkle,
  SpinnerGap,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { ApprovedTray } from "./components/ApprovedTray";
import { EvidencePanel } from "./components/EvidencePanel";
import { type ApprovedFixRecord, FixStudio } from "./components/FixStudio";
import { LeakRail } from "./components/LeakRail";
import { StatusPill } from "./components/StatusPill";
import {
  buildAnalyzeRequest,
  centsToCurrency,
  createImplementationBrief,
  mergeRankedLeaks,
  sampleAnalysisResponse,
  sampleBriefMeta,
  sampleCandidates,
  sampleStore,
  type AnalyzeResponse,
  type LiveState,
  type RecommendedFix,
} from "./data/cartCause";

interface UploadPreviewState {
  name: string;
  sizeLabel: string;
}

const liveStateTone: Record<
  LiveState,
  { label: string; tone: "default" | "signal" | "success" | "error" }
> = {
  sample: { label: "Idle sample", tone: "default" },
  analyzing: { label: "Analyzing", tone: "signal" },
  success: { label: "Live brief ready", tone: "success" },
  error: { label: "Live request failed", tone: "error" },
};

function readSessionId(): string {
  if (typeof window === "undefined") {
    return "cartcause-session";
  }

  const existing = window.localStorage.getItem("cartcause-session-id");
  if (existing) {
    return existing;
  }

  const nextValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `cartcause-${Date.now()}`;

  window.localStorage.setItem("cartcause-session-id", nextValue);
  return nextValue;
}

function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T09:00:00`));
}

function bytesToLabel(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continue to the local selection fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export default function App() {
  const reduceMotion = useReducedMotion();
  const [analysisResponse, setAnalysisResponse] =
    useState<AnalyzeResponse>(sampleAnalysisResponse);
  const [liveState, setLiveState] = useState<LiveState>("sample");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLeakId, setSelectedLeakId] = useState(sampleCandidates[0]?.id ?? "");
  const [approvedRecords, setApprovedRecords] = useState<Record<string, ApprovedFixRecord>>({});
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewState | null>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [briefDate] = useState(sampleBriefMeta.briefDate);
  const [clientSessionId] = useState(readSessionId);

  const mergedLeaks = useMemo(
    () => mergeRankedLeaks(sampleCandidates, analysisResponse),
    [analysisResponse],
  );

  const selectedLeak =
    mergedLeaks.find((candidate) => candidate.id === selectedLeakId) ??
    mergedLeaks[0];

  useEffect(() => {
    if (!selectedLeak) {
      return;
    }

    if (selectedLeak.id !== selectedLeakId) {
      setSelectedLeakId(selectedLeak.id);
    }
  }, [selectedLeak, selectedLeakId]);

  useEffect(() => {
    if (!copiedBrief) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedBrief(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedBrief]);

  const approvedItems = useMemo(
    () =>
      Object.values(approvedRecords).sort((left, right) =>
        left.title.localeCompare(right.title),
      ),
    [approvedRecords],
  );

  const approvedTitlesForSelected = approvedItems
    .filter((item) => item.leakId === selectedLeak?.id)
    .map((item) => item.title);

  async function handleRunLiveBrief() {
    setLiveState("analyzing");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildAnalyzeRequest(clientSessionId, briefDate)),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as AnalyzeResponse;

      startTransition(() => {
        setAnalysisResponse(payload);
        setLiveState(payload.meta.live ? "success" : "sample");
      });
    } catch (error) {
      setLiveState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unknown error while requesting the live brief.",
      );
    }
  }

  function handleApproveFix(fix: RecommendedFix) {
    if (!selectedLeak) {
      return;
    }

    const key = `${selectedLeak.id}:${fix.title}`;
    setApprovedRecords((current) => ({
      ...current,
      [key]: {
        leakId: selectedLeak.id,
        productName: selectedLeak.product.name,
        title: fix.title,
        type: fix.type,
      },
    }));
  }

  function handleRejectFix(fix: RecommendedFix) {
    if (!selectedLeak) {
      return;
    }

    const key = `${selectedLeak.id}:${fix.title}`;
    setApprovedRecords((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleCopyBrief() {
    if (!selectedLeak) {
      return;
    }

    const brief = createImplementationBrief(
      selectedLeak,
      approvedTitlesForSelected,
      liveState,
      analysisResponse.meta.model,
    );

    try {
      const copied = await copyTextToClipboard(brief);
      if (!copied) {
        throw new Error("Clipboard write was rejected");
      }
      setCopiedBrief(true);
    } catch {
      setCopiedBrief(false);
      setErrorMessage("Clipboard access failed. Please retry in a secure context.");
    }
  }

  function handlePreviewUpload(file: File | null) {
    if (!file) {
      setUploadPreview(null);
      return;
    }

    setUploadPreview({
      name: file.name,
      sizeLabel: bytesToLabel(file.size),
    });
  }

  const stateMeta = liveStateTone[liveState];

  return (
    <LazyMotion features={domAnimation}>
      <div className="brief-grid min-h-screen bg-[var(--ink)] text-[var(--paper)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--paper)] focus:px-4 focus:py-2 focus:text-[var(--ink)]"
        >
          Skip to content
        </a>

        <div className="mx-auto flex min-h-screen w-full max-w-[1580px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <header className="hero-panel grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
            <div className="flex min-h-[19rem] flex-col justify-between p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)]">
                  <ChartLine size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.25em] text-[var(--ink)]">
                    CartCause
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    A daily operating brief for store owners
                  </p>
                </div>
              </div>

              <div className="mt-12 max-w-3xl">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.24em] text-[var(--coral-deep)]">
                  Find the cause behind the cost
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)] sm:text-5xl lg:text-[3.5rem]">
                  Yesterday's profit leaks, ready to fix before lunch.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--ink-muted)] sm:text-base">
                  CartCause connects return signals, reviews, support notes, and product
                  promises into one evidence-linked morning brief for {sampleStore.name}.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="light-chip">Work &amp; Productivity</span>
                <span className="light-chip">{stateMeta.label}</span>
                <span className="light-chip">
                  {analysisResponse.meta.live ? analysisResponse.meta.model : "Sample mode"}
                </span>
              </div>
            </div>

            <figure className="relative min-h-[19rem] overflow-hidden border-t border-black/10 lg:border-l lg:border-t-0">
              <img
                src="/assets/cartcause-editorial.png"
                alt="A running shoe, return slip, reviews, and evidence tags connected into one cause"
                width="1536"
                height="1024"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/78 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[var(--paper)] md:p-6">
                <span className="max-w-[15rem] text-sm font-semibold leading-6">
                  Returns, reviews, support, and PDP claims traced to one decision.
                </span>
                <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                  Evidence first
                </span>
              </figcaption>
            </figure>
          </header>

          <main
            id="main-content"
            className="mt-6 grid flex-1 gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,360px)]"
          >
            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              <section className="paper-panel overflow-hidden p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="signal">Morning brief</StatusPill>
                  <StatusPill tone="muted">{formatDateLabel(briefDate)}</StatusPill>
                  <StatusPill tone="muted">
                    {sampleBriefMeta.ordersYesterday} orders yesterday
                  </StatusPill>
                </div>

                <div className="mt-6 max-w-sm">
                  <p className="eyebrow">Sample leakage observed</p>
                  <AnimatePresence mode="wait">
                    <m.p
                      key={analysisResponse.meta.live ? "live-total" : "sample-total"}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
                      className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[var(--paper)]"
                    >
                      {centsToCurrency(sampleBriefMeta.sampleLeakageTotalCents)}
                    </m.p>
                  </AnimatePresence>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    Built from sample store data. GPT-5.6 ranks the likely causes and drafts
                    the fixes. Arithmetic and display metrics are computed locally.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleRunLiveBrief}
                    disabled={liveState === "analyzing"}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--coral)_48%,transparent)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_34px_rgba(254,137,111,0.28)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                  >
                    {liveState === "analyzing" ? (
                      <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkle size={18} aria-hidden="true" />
                    )}
                    Run live GPT-5.6 brief
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisResponse(sampleAnalysisResponse);
                      setLiveState("sample");
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                  >
                    <ArrowClockwise size={18} aria-hidden="true" />
                    Reset to sample brief
                  </button>
                </div>
              </section>

              <LeakRail
                leaks={mergedLeaks}
                selectedLeakId={selectedLeak?.id ?? ""}
                onSelect={setSelectedLeakId}
              />
            </div>

            <div className="space-y-6">
              <section className="paper-panel p-5 md:p-6">
                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_23rem]">
                  <div className="max-w-2xl">
                    <p className="eyebrow">Owner summary</p>
                    <p className="mt-3 text-base leading-8 text-[var(--paper)]">
                      {analysisResponse.analysis.owner_summary}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-white/8 bg-[var(--surface)] p-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                        Model boundary
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                        Local code computes the arithmetic. GPT-5.6 ranks likely causes and
                        drafts fix language. Live failures never replace the seeded sample.
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-[var(--surface)] p-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                        Upload intake
                      </p>
                      <label className="mt-2 flex cursor-pointer flex-col gap-3 rounded-[1.2rem] border border-dashed border-white/15 bg-black/10 p-4 text-sm text-[var(--ink-soft)] transition hover:border-white/25 hover:text-[var(--paper)] focus-within:border-[var(--coral)]">
                        <span className="inline-flex items-center gap-2 font-semibold text-[var(--paper)]">
                          <UploadSimple size={18} aria-hidden="true" />
                          Add returns export
                        </span>
                        <span id="upload-preview-note">
                          Preview only. This upload does not connect to the live API yet.
                        </span>
                        <input
                          type="file"
                          accept=".csv,.txt,.json"
                          aria-label="Preview a returns export"
                          aria-describedby="upload-preview-note"
                          className="sr-only"
                          onChange={(event) =>
                            handlePreviewUpload(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                      {uploadPreview ? (
                        <p
                          role="status"
                          className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]"
                        >
                          Preview: {uploadPreview.name} • {uploadPreview.sizeLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  aria-live="polite"
                  className="mt-4 min-h-[3.75rem] rounded-[1.4rem] border border-white/8 bg-black/10 p-4 text-sm leading-7 text-[var(--ink-soft)]"
                >
                  {liveState === "analyzing" ? (
                    <span className="inline-flex items-center gap-2 text-[var(--paper)]">
                      <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
                      Preparing request and waiting for `/api/analyze`.
                    </span>
                  ) : null}
                  {liveState === "success" ? (
                    <span className="inline-flex items-center gap-2 text-[var(--paper)]">
                      <Flask size={16} aria-hidden="true" />
                      Live analysis merged into the sample brief by `candidate_id`.
                    </span>
                  ) : null}
                  {liveState === "error" ? (
                    <span className="inline-flex items-center gap-2 text-[var(--paper)]">
                      <Warning size={16} aria-hidden="true" />
                      Live analysis failed. The seeded sample brief remains visible.{" "}
                      {errorMessage ? `Reason: ${errorMessage}` : ""}
                    </span>
                  ) : null}
                  {liveState === "sample" ? (
                    <span className="inline-flex items-center gap-2 text-[var(--paper)]">
                      <ClockCountdown size={16} aria-hidden="true" />
                      Sample mode is active. Run the live brief when `/api/analyze` is ready.
                    </span>
                  ) : null}
                </div>
              </section>

              {selectedLeak ? <EvidencePanel leak={selectedLeak} /> : null}

              <ApprovedTray items={approvedItems} />
            </div>

            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              {selectedLeak ? (
                <FixStudio
                  leak={selectedLeak}
                  approvedTitles={approvedTitlesForSelected}
                  onApprove={handleApproveFix}
                  onReject={handleRejectFix}
                  onCopyBrief={handleCopyBrief}
                  isCopying={copiedBrief}
                />
              ) : null}

              <section className="paper-panel p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-[var(--acid)]" aria-hidden="true" />
                  <div>
                    <p className="eyebrow">Disclosure</p>
                    <h2 className="mt-2 text-lg font-semibold text-[var(--paper)]">
                      Sample mode stays obvious
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                  This prototype keeps the seeded {sampleStore.name} data visible in every
                  state. If a live call fails, the app labels the result and preserves the
                  sample brief instead of pretending the model responded.
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </LazyMotion>
  );
}
