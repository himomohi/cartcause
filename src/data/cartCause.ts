export type EvidenceType = "return" | "review" | "support" | "product_copy";
export type FixType =
  | "product_copy"
  | "size_guide"
  | "cx_macro"
  | "shipping_notice";
export type Confidence = "high" | "medium" | "low";
export type LiveState = "sample" | "analyzing" | "success" | "error";

export interface StoreProfile {
  name: string;
  currency: "USD";
}

export interface LeakEvidence {
  id: string;
  type: EvidenceType;
  excerpt: string;
  sourceLabel: string;
}

export interface CurrentCopy {
  description: string;
  faq: string;
}

export interface LeakCandidate {
  id: string;
  product: {
    sku: string;
    name: string;
  };
  computed: {
    estimatedLeakageCents: number;
    orders: number;
    returns: number;
    returnRateBps: number;
    baselineReturnRateBps: number;
  };
  evidence: LeakEvidence[];
  currentCopy: CurrentCopy;
}

export interface RecommendedFix {
  type: FixType;
  title: string;
  rationale: string;
  evidence_refs: string[];
  before: string;
  after: string;
}

export interface RankedLeak {
  candidate_id: string;
  rank: number;
  headline: string;
  cause_hypothesis: string;
  confidence: Confidence;
  evidence_refs: string[];
  recommended_fixes: RecommendedFix[];
  what_not_to_claim: string;
}

export interface AnalyzeResponse {
  analysis: {
    owner_summary: string;
    ranked_leaks: RankedLeak[];
  };
  meta: {
    model: string;
    live: boolean;
  };
}

export interface AnalyzeRequest {
  clientSessionId: string;
  store: StoreProfile;
  briefDate: string;
  dataUse: {
    source: "seeded_sample" | "untrusted_normalized_csv";
    fictionalOrRedacted: true;
    rawFileUploaded: false;
  };
  candidates: LeakCandidate[];
}

export interface MergedLeak extends LeakCandidate {
  analysis: RankedLeak;
}

export const LIVE_API_KEY_HEADER = "X-OpenAI-Api-Key";

export const sampleStore: StoreProfile = {
  name: "Morrow Supply",
  currency: "USD",
};

export const sampleBriefMeta = {
  briefDate: "2026-07-18",
  ordersYesterday: 128,
  sampleLeakageTotalCents: 165200,
} as const;

export const sampleCandidates: LeakCandidate[] = [
  {
    id: "cf-runner",
    product: {
      sku: "CF-RUN-01",
      name: "CloudForm Runner",
    },
    computed: {
      estimatedLeakageCents: 84600,
      orders: 76,
      returns: 14,
      returnRateBps: 1842,
      baselineReturnRateBps: 710,
    },
    evidence: [
      {
        id: "RET-1048",
        type: "return",
        excerpt: "Too tight through the toe box. Sized up and it finally fit.",
        sourceLabel: "Return note, Jul 17",
      },
      {
        id: "REV-221",
        type: "review",
        excerpt: "Love the look, but it definitely runs small compared with my normal 9.",
        sourceLabel: "Verified review",
      },
      {
        id: "SUP-73",
        type: "support",
        excerpt: "Customer asked if they should go half a size up after their first pair felt short.",
        sourceLabel: "Support chat",
      },
      {
        id: "PDP-11",
        type: "product_copy",
        excerpt: "Current PDP copy says true to size with no fit exceptions.",
        sourceLabel: "Product detail page",
      },
    ],
    currentCopy: {
      description:
        "Lightweight knit runner with all-day cushioning and a clean everyday profile. True to size fit.",
      faq: "Fit: We recommend ordering your usual size.",
    },
  },
  {
    id: "transit-weekender",
    product: {
      sku: "TW-04",
      name: "Transit Weekender",
    },
    computed: {
      estimatedLeakageCents: 51700,
      orders: 32,
      returns: 7,
      returnRateBps: 2188,
      baselineReturnRateBps: 710,
    },
    evidence: [
      {
        id: "RET-991",
        type: "return",
        excerpt: "Expected a padded laptop sleeve. Mine only had a soft divider.",
        sourceLabel: "Refund reason",
      },
      {
        id: "REV-208",
        type: "review",
        excerpt: "Photos made the side pocket look structured enough for a work laptop.",
        sourceLabel: "Verified review",
      },
      {
        id: "SUP-58",
        type: "support",
        excerpt: "We are answering the same 'does it fit a 16 inch laptop' question several times a week.",
        sourceLabel: "CX macro draft",
      },
      {
        id: "PDP-42",
        type: "product_copy",
        excerpt: "Current copy mentions commuter-ready organization but does not define the laptop compartment.",
        sourceLabel: "Product detail page",
      },
    ],
    currentCopy: {
      description:
        "Weekend holdall with commuter-ready organization, soft structure, and weather-minded canvas.",
      faq: "Storage: Interior pockets keep travel essentials close at hand.",
    },
  },
  {
    id: "core-linen-set",
    product: {
      sku: "CLS-02",
      name: "Core Linen Set",
    },
    computed: {
      estimatedLeakageCents: 28900,
      orders: 20,
      returns: 5,
      returnRateBps: 2500,
      baselineReturnRateBps: 710,
    },
    evidence: [
      {
        id: "CAN-118",
        type: "support",
        excerpt: "Canceled because dispatch timing was not clear before checkout.",
        sourceLabel: "Cancellation note",
      },
      {
        id: "SUP-84",
        type: "support",
        excerpt: "Customer expected next-day dispatch after seeing 'summer ready' language on the PDP.",
        sourceLabel: "Support email",
      },
      {
        id: "REV-319",
        type: "review",
        excerpt: "Product arrived later than expected. Wish the ship window was clearer.",
        sourceLabel: "Post-purchase review",
      },
      {
        id: "PDP-63",
        type: "product_copy",
        excerpt: "Dispatch timing only appears deep in the FAQ and not near the add-to-cart area.",
        sourceLabel: "Product detail page",
      },
    ],
    currentCopy: {
      description:
        "Breathable linen bedding in washed neutrals for warmer nights and easy layering.",
      faq: "Shipping: Processing details are available in our help center.",
    },
  },
];

export const sampleAnalysisResponse: AnalyzeResponse = {
  analysis: {
    owner_summary:
      "Sample store data points to a fit expectation issue first, a feature expectation mismatch second, and a dispatch clarity gap third. Each fix is copy-first and ready for an owner approval pass today.",
    ranked_leaks: [
      {
        candidate_id: "cf-runner",
        rank: 1,
        headline: "Fit promise is overstating certainty on the hero SKU",
        cause_hypothesis:
          "The PDP promises true to size while returns, reviews, and support all cluster around a runs-small experience.",
        confidence: "high",
        evidence_refs: ["RET-1048", "REV-221", "SUP-73", "PDP-11"],
        recommended_fixes: [
          {
            type: "product_copy",
            title: "Replace the fit promise with a narrower sizing note",
            rationale:
              "Bring the PDP into line with the repeated evidence and reduce preventable first-order returns.",
            evidence_refs: ["RET-1048", "REV-221", "PDP-11"],
            before:
              "Lightweight knit runner with all-day cushioning and a clean everyday profile. True to size fit.",
            after:
              "Lightweight knit runner with all-day cushioning and a clean everyday profile. Fit feedback describes a close toe box; shoppers who prefer more room may want to consider a half size up.",
          },
          {
            type: "size_guide",
            title: "Add a two-line fit note beside size selection",
            rationale:
              "Move the clarification to the decision point instead of burying it in the FAQ.",
            evidence_refs: ["RET-1048", "REV-221", "PDP-11"],
            before: "Fit: We recommend ordering your usual size.",
            after:
              "Fit note: Streamlined through the toe box. Between sizes or prefer extra room? Choose a half size up.",
          },
          {
            type: "cx_macro",
            title: "Give support a standard sizing reply",
            rationale:
              "Consistent CX language keeps pre-purchase answers aligned with the revised PDP copy.",
            evidence_refs: ["SUP-73", "RET-1048"],
            before: "General support reply with no fit guidance.",
            after:
              "Fit feedback describes a close toe box. If you prefer extra room or are between sizes, consider a half size up.",
          },
        ],
        what_not_to_claim:
          "Do not claim the shoe fits everyone true to size or suggest returns are caused by customer error.",
      },
      {
        candidate_id: "transit-weekender",
        rank: 2,
        headline: "Bag copy invites a laptop assumption the product does not meet",
        cause_hypothesis:
          "Commuter-ready language and imagery imply a padded laptop sleeve even though the interior is a soft divider.",
        confidence: "medium",
        evidence_refs: ["RET-991", "REV-208", "SUP-58", "PDP-42"],
        recommended_fixes: [
          {
            type: "product_copy",
            title: "Name the divider clearly in the first storage sentence",
            rationale:
              "Removing ambiguity is the fastest way to reduce expectation mismatch on the PDP.",
            evidence_refs: ["RET-991", "REV-208", "PDP-42"],
            before:
              "Weekend holdall with commuter-ready organization, soft structure, and weather-minded canvas.",
            after:
              "Weekend holdall with commuter-ready organization, including a soft interior divider for papers, chargers, and slim devices. This bag does not include a padded laptop sleeve.",
          },
          {
            type: "cx_macro",
            title: "Standardize the laptop-compartment answer",
            rationale:
              "A short CX macro reduces refund-driven confusion while the PDP update ships.",
            evidence_refs: ["SUP-58", "RET-991"],
            before: "No standard response for laptop fit questions.",
            after:
              "The Transit Weekender has a soft interior divider rather than a padded laptop sleeve. For structured laptop protection, we recommend adding a sleeve or choosing a different bag.",
          },
        ],
        what_not_to_claim:
          "Do not imply the bag has padded laptop protection or full commuter padding unless the construction changes.",
      },
      {
        candidate_id: "core-linen-set",
        rank: 3,
        headline: "Dispatch timing is too hidden for a time-sensitive home purchase",
        cause_hypothesis:
          "Customers see aspirational seasonal language before they see the actual dispatch window, which drives cancellations and avoidable refund pressure.",
        confidence: "medium",
        evidence_refs: ["CAN-118", "SUP-84", "REV-319", "PDP-63"],
        recommended_fixes: [
          {
            type: "shipping_notice",
            title: "Surface the dispatch window above the fold",
            rationale:
              "A direct ship window near the CTA sets timing expectations before purchase intent hardens.",
            evidence_refs: ["CAN-118", "SUP-84", "PDP-63"],
            before: "Shipping: Processing details are available in our help center.",
            after:
              "Dispatch timing: [Insert the current operations-approved processing window here before publishing].",
          },
          {
            type: "product_copy",
            title: "Pair the seasonal promise with the dispatch note",
            rationale:
              "This keeps the emotional headline while reducing the timing gap that is prompting cancellations.",
            evidence_refs: ["REV-319", "PDP-63"],
            before:
              "Breathable linen bedding in washed neutrals for warmer nights and easy layering.",
            after:
              "Breathable linen bedding in washed neutrals for warmer nights and easy layering. Dispatch timing: [insert the current operations-approved processing window before publishing].",
          },
        ],
        what_not_to_claim:
          "Do not imply immediate dispatch, rush fulfillment, or guaranteed delivery dates not supported by operations.",
      },
    ],
  },
  meta: {
    model: "Seeded sample brief",
    live: false,
  },
};

export const evidenceTypeLabels: Record<EvidenceType, string> = {
  return: "Return",
  review: "Review",
  support: "Support",
  product_copy: "PDP copy",
};

export const confidenceTone: Record<
  Confidence,
  { label: string; className: string }
> = {
  high: {
    label: "High confidence",
    className:
      "border-[color:color-mix(in_srgb,var(--coral)_42%,transparent)] bg-[color:color-mix(in_srgb,var(--coral)_14%,transparent)] text-[var(--ink-strong)]",
  },
  medium: {
    label: "Medium confidence",
    className:
      "border-[color:color-mix(in_srgb,var(--acid)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--acid)_14%,transparent)] text-[var(--ink-strong)]",
  },
  low: {
    label: "Low confidence",
    className:
      "border-white/15 bg-white/5 text-[var(--ink-soft)]",
  },
};

export function buildAnalyzeRequest(
  clientSessionId: string,
  briefDate: string = sampleBriefMeta.briefDate,
  store: StoreProfile = sampleStore,
  candidates: LeakCandidate[] = sampleCandidates,
  source: AnalyzeRequest["dataUse"]["source"] = "seeded_sample",
): AnalyzeRequest {
  return {
    clientSessionId,
    store: { ...store },
    briefDate,
    dataUse: {
      source,
      fictionalOrRedacted: true,
      rawFileUploaded: false,
    },
    candidates: candidates.map((candidate) => ({
      ...candidate,
      evidence: candidate.evidence.map((item) => ({ ...item })),
      currentCopy: { ...candidate.currentCopy },
      product: { ...candidate.product },
      computed: { ...candidate.computed },
    })),
  };
}

export function buildAnalyzeRequestHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [LIVE_API_KEY_HEADER]: apiKey.trim(),
  };
}

export function isSecureApiKeyTransport(
  protocol: string,
  hostname: string,
): boolean {
  if (protocol === "https:") {
    return true;
  }

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function mergeRankedLeaks(
  candidates: LeakCandidate[],
  response: AnalyzeResponse,
): MergedLeak[] {
  const rankedLookup = new Map(
    response.analysis.ranked_leaks.map((leak) => [leak.candidate_id, leak]),
  );
  const sampleLookup = new Map(
    sampleAnalysisResponse.analysis.ranked_leaks.map((leak) => [
      leak.candidate_id,
      leak,
    ]),
  );

  return candidates
    .map((candidate, index) => {
      const analysis =
        rankedLookup.get(candidate.id) ?? sampleLookup.get(candidate.id);

      if (!analysis) {
        throw new Error(`Missing ranked leak analysis for ${candidate.id}`);
      }

      return {
        ...candidate,
        analysis,
      };
    })
    .sort((left, right) => {
      if (left.analysis.rank !== right.analysis.rank) {
        return left.analysis.rank - right.analysis.rank;
      }

      if (
        left.computed.estimatedLeakageCents !== right.computed.estimatedLeakageCents
      ) {
        return (
          right.computed.estimatedLeakageCents -
          left.computed.estimatedLeakageCents
        );
      }

      return left.product.name.localeCompare(right.product.name);
    });
}

export function centsToCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: sampleStore.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function basisPointsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function percentDeltaLabel(
  valueBps: number,
  baselineBps: number,
): string {
  const delta = (valueBps - baselineBps) / 100;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} pts`;
}

export function createImplementationBrief(
  leak: MergedLeak,
  approvedFixTitles: string[],
  liveState: LiveState,
  modelName: string,
  storeName: string = sampleStore.name,
): string {
  const approvedSet = new Set(approvedFixTitles);
  const fixes = leak.analysis.recommended_fixes.filter(
    (fix) => approvedSet.size === 0 || approvedSet.has(fix.title),
  );

  return [
    `# CartCause brief for ${leak.product.name}`,
    "",
    `Store: ${storeName}`,
    `SKU: ${leak.product.sku}`,
    `Leak estimate: ${centsToCurrency(leak.computed.estimatedLeakageCents)}`,
    `Confidence: ${leak.analysis.confidence}`,
    `Brief state: ${liveState}`,
    `Model source: ${modelName}`,
    "",
    "## Cause hypothesis",
    leak.analysis.cause_hypothesis,
    "",
    "## Evidence refs",
    ...leak.analysis.evidence_refs.map((ref) => `- ${ref}`),
    "",
    "## Approved-ready fixes",
    ...fixes.map(
      (fix) =>
        `- [${fix.type}] ${fix.title}\n  Evidence: ${fix.evidence_refs.join(", ")}\n  Rationale: ${fix.rationale}\n  Before: ${fix.before}\n  After: ${fix.after}`,
    ),
    "",
    "## What not to claim",
    leak.analysis.what_not_to_claim,
  ].join("\n");
}
