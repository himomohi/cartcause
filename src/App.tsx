import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ChartLine,
  ClockCountdown,
  Eye,
  EyeSlash,
  Flask,
  Key,
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
  buildAnalyzeRequestHeaders,
  centsToCurrency,
  createImplementationBrief,
  isSecureApiKeyTransport,
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
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (apiKey.trim()) {
      setErrorMessage(null);
    }
  }, [apiKey]);

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
  const hasApiKey = apiKey.trim().length > 0;
  const secureApiKeyTransport =
    typeof window === "undefined"
      ? true
      : isSecureApiKeyTransport(window.location.protocol, window.location.hostname);
  const keyMessage = !hasApiKey
    ? "Enter a key to enable live mode. It stays in tab memory until you run, then is sent over HTTPS to OpenAI and cleared. Never stored."
    : secureApiKeyTransport
      ? "Held in tab memory only until the live request starts, then cleared immediately. Never written to browser storage or cookies."
      : "Live key submission requires HTTPS outside localhost.";
  const liveButtonDisabled = liveState === "analyzing" || !secureApiKeyTransport;

  async function handleRunLiveBrief() {
    if (!hasApiKey) {
      setLiveState("error");
      setErrorMessage("Enter an API key before requesting the live brief.");
      window.requestAnimationFrame(() => apiKeyInputRef.current?.focus());
      return;
    }

    if (!secureApiKeyTransport) {
      setLiveState("error");
      setErrorMessage("Live key submission requires HTTPS outside localhost.");
      return;
    }

    setLiveState("analyzing");
    setErrorMessage(null);

    try {
      const requestHeaders = buildAnalyzeRequestHeaders(apiKey);
      const requestBody = JSON.stringify(buildAnalyzeRequest(clientSessionId, briefDate));

      setApiKey("");
      setShowApiKey(false);

      const response = await fetch("/api/analyze", {
        method: "POST",
        cache: "no-store",
        headers: requestHeaders,
        body: requestBody,
      });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
          const payload = (await response.json()) as {
            error?: { message?: string };
          };
          if (payload.error?.message) {
            message = payload.error.message;
          }
        } catch {
          // Keep the status-based fallback message.
        }

        throw new Error(message);
      }

      const payload = (await response.json()) as AnalyzeResponse;

      startTransition(() => {
        setAnalysisResponse(payload);
        setLiveState(payload.meta.live ? "success" : "sample");
        setShowApiKey(false);
      });
    } catch (error) {
      setLiveState("error");
      setErrorMessage(
        error instanceof Error
          ? `${error.message} Re-enter your API key to retry.`
          : "Unknown error while requesting the live brief. Re-enter your API key to retry.",
      );
      window.requestAnimationFrame(() => apiKeyInputRef.current?.focus());
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

  function handleClearApiKey() {
    setApiKey("");
    setShowApiKey(false);
    setErrorMessage(null);
    if (liveState === "error") {
      setLiveState("sample");
    }
    window.requestAnimationFrame(() => apiKeyInputRef.current?.focus());
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
                    disabled={liveButtonDisabled}
                    aria-describedby="live-brief-key-hint"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--coral)_48%,transparent)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_34px_rgba(254,137,111,0.28)] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                  >
                    {liveState === "analyzing" ? (
                      <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkle size={18} aria-hidden="true" />
                    )}
                    {hasApiKey ? "Run live GPT-5.6 brief" : "Add key to run GPT-5.6"}
                  </button>

                  <p id="live-brief-key-hint" className="text-xs leading-5 text-[var(--ink-soft)]">
                    {hasApiKey
                      ? "Your key is ready for one request and is not persisted."
                      : "Select this button to focus the temporary key field; the key is sent only when you run."}
                  </p>

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
                    <div className="rounded-[1.4rem] border border-black/10 bg-[var(--paper)] p-4 text-[var(--ink)] shadow-[0_12px_32px_rgba(9,12,15,0.14)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--coral-deep)]">
                            Bring your own key
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                            Use a temporary OpenAI project key you can revoke after this live request. CartCause does not keep it.
                          </p>
                        </div>
                        <span className="light-chip">
                          <Key size={14} aria-hidden="true" />
                          <span className="ml-2">Request-scoped</span>
                        </span>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor="live-api-key"
                          className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]"
                        >
                          OpenAI API key
                        </label>
                        <div className="mt-2 flex gap-2">
                          <input
                            ref={apiKeyInputRef}
                            id="live-api-key"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(event) => setApiKey(event.target.value)}
                            autoComplete="new-password"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="text"
                            placeholder="sk-proj-..."
                            aria-describedby="live-api-key-note"
                            className="editorial-input min-h-12 flex-1 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey((current) => !current)}
                            className="inline-flex min-h-12 items-center gap-2 rounded-[1rem] border border-black/12 bg-white/40 px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                            aria-pressed={showApiKey}
                            aria-label={showApiKey ? "Hide API key" : "Show API key"}
                          >
                            {showApiKey ? (
                              <EyeSlash size={18} aria-hidden="true" />
                            ) : (
                              <Eye size={18} aria-hidden="true" />
                            )}
                            {showApiKey ? "Hide" : "Show"}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p
                            id="live-api-key-note"
                            className={[
                              "text-sm leading-6",
                              hasApiKey && secureApiKeyTransport
                                ? "text-[var(--ink-muted)]"
                                : "text-[var(--coral-deep)]",
                            ].join(" ")}
                          >
                            {keyMessage}
                          </p>
                          <button
                            type="button"
                            onClick={handleClearApiKey}
                            className="inline-flex min-h-11 items-center rounded-full border border-black/12 px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                          >
                            Clear key
                          </button>
                        </div>
                      </div>
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
                      Live analysis merged into the sample brief by `candidate_id`. The request key has already been cleared from tab memory.
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
                      Sample mode is active. Add your key, then run the live brief when `/api/analyze` is ready.
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
