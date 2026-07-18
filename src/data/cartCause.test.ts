import { describe, expect, it } from "vitest";
import {
  buildAnalyzeRequest,
  mergeRankedLeaks,
  sampleAnalysisResponse,
  sampleBriefMeta,
  sampleCandidates,
  sampleStore,
  type AnalyzeResponse,
} from "./cartCause";

describe("buildAnalyzeRequest", () => {
  it("matches the required /api/analyze shape for the seeded sample", () => {
    const request = buildAnalyzeRequest("session-123", sampleBriefMeta.briefDate);

    expect(request).toEqual({
      clientSessionId: "session-123",
      store: sampleStore,
      briefDate: sampleBriefMeta.briefDate,
      candidates: sampleCandidates,
    });
  });
});

describe("mergeRankedLeaks", () => {
  it("overlays live analysis by candidate_id and preserves seeded fallback content", () => {
    const liveResponse: AnalyzeResponse = {
      analysis: {
        owner_summary: "Live response",
        ranked_leaks: [
          {
            candidate_id: "transit-weekender",
            rank: 1,
            headline: "Laptop expectation mismatch stays first",
            cause_hypothesis: "Live cause",
            confidence: "high",
            evidence_refs: ["RET-991"],
            recommended_fixes: [
              {
                type: "cx_macro",
                title: "Clarify laptop storage",
                rationale: "Live rationale",
                before: "Before",
                after: "After",
              },
            ],
            what_not_to_claim: "Do not promise padding.",
          },
        ],
      },
      meta: {
        model: "gpt-5.6",
        live: true,
      },
    };

    const merged = mergeRankedLeaks(sampleCandidates, liveResponse);

    const overlaidWeekender = merged.find((item) => item.id === "transit-weekender");
    expect(overlaidWeekender?.analysis.headline).toBe(
      "Laptop expectation mismatch stays first",
    );
    expect(overlaidWeekender?.analysis.confidence).toBe("high");

    const preservedRunner = merged.find((item) => item.id === "cf-runner");
    expect(preservedRunner?.analysis.headline).toBe(
      sampleAnalysisResponse.analysis.ranked_leaks[0]?.headline,
    );
  });
});
