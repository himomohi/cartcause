import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App BYOK flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears the api key input once a live request starts", async () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      configurable: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        analysis: {
          owner_summary: "Live summary",
          ranked_leaks: [
            {
              candidate_id: "cf-runner",
              rank: 1,
              headline: "Live headline A",
              cause_hypothesis: "Live hypothesis A",
              confidence: "high",
              evidence_refs: ["RET-1048", "REV-221"],
              recommended_fixes: [
                {
                  type: "size_guide",
                  title: "Live fix A",
                  rationale: "Live rationale A",
                  before: "Before A",
                  after: "After A",
                },
              ],
              what_not_to_claim: "Do not overclaim A.",
            },
            {
              candidate_id: "transit-weekender",
              rank: 2,
              headline: "Live headline B",
              cause_hypothesis: "Live hypothesis B",
              confidence: "medium",
              evidence_refs: ["RET-991", "REV-208"],
              recommended_fixes: [
                {
                  type: "product_copy",
                  title: "Live fix B",
                  rationale: "Live rationale B",
                  before: "Before B",
                  after: "After B",
                },
              ],
              what_not_to_claim: "Do not overclaim B.",
            },
            {
              candidate_id: "core-linen-set",
              rank: 3,
              headline: "Live headline C",
              cause_hypothesis: "Live hypothesis C",
              confidence: "low",
              evidence_refs: ["CAN-118", "SUP-84"],
              recommended_fixes: [
                {
                  type: "shipping_notice",
                  title: "Live fix C",
                  rationale: "Live rationale C",
                  before: "Before C",
                  after: "After C",
                },
              ],
              what_not_to_claim: "Do not overclaim C.",
            },
          ],
        },
        meta: {
          model: "gpt-5.6",
          live: true,
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("OpenAI API key");
    await user.type(input, "test-byok-secret");
    await user.click(screen.getByRole("button", { name: "Run live GPT-5.6 brief" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(input).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/analyze",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-OpenAI-Api-Key": "test-byok-secret",
        }),
      }),
    );
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("test-byok-secret"),
    );
  });
});
