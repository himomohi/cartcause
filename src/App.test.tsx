import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App flows", () => {
  afterEach(() => {
    cleanup();
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
                  evidence_refs: ["RET-1048"],
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
                  evidence_refs: ["RET-991"],
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
                  evidence_refs: ["CAN-118"],
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

  it("normalizes the CSV template and uses it for the confirmed live request", async () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      configurable: true,
    });

    const csv = [
      "store_name,candidate_id,sku,product_name,estimated_leakage_cents,orders,returns,baseline_return_rate_bps,evidence_id,evidence_type,evidence_excerpt,source_label,current_description,current_faq",
      "Imported Store,item-a,SKU-A,Item A,1200,10,2,500,E-1,return,Too small,Return note,Current copy,Current FAQ",
      "Imported Store,item-a,SKU-A,Item A,1200,10,2,500,E-2,review,Runs small,Review,Current copy,Current FAQ",
    ].join("\n");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => csv,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analysis: {
            owner_summary: "Imported live summary",
            ranked_leaks: [
              {
                candidate_id: "item-a",
                rank: 1,
                headline: "Imported headline",
                cause_hypothesis: "Imported hypothesis",
                confidence: "high",
                evidence_refs: ["E-1", "E-2"],
                recommended_fixes: [
                  {
                    type: "product_copy",
                    title: "Imported fix",
                    rationale: "Imported rationale",
                    evidence_refs: ["E-1", "E-2"],
                    before: "Current copy",
                    after: "Updated copy",
                  },
                ],
                what_not_to_claim: "Do not overclaim.",
              },
            ],
          },
          meta: { model: "gpt-5.6", live: true },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Load fictional template" }));
    expect(
      await screen.findByText(
        "1 candidates and 2 evidence excerpts normalized in this browser.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this packet is fictional or redacted/,
      }),
    );
    await user.type(screen.getByLabelText("OpenAI API key"), "test-import-key");
    await user.click(screen.getByRole("button", { name: "Run live GPT-5.6 brief" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const liveRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(liveRequest.body))).toMatchObject({
      store: { name: "Imported Store", currency: "USD" },
      dataUse: {
        source: "untrusted_normalized_csv",
        fictionalOrRedacted: true,
        rawFileUploaded: false,
      },
      candidates: [{ id: "item-a", product: { sku: "SKU-A" } }],
    });
    expect(await screen.findByText("Imported live summary")).toBeInTheDocument();
    expect(screen.getAllByText("Imported CSV").length).toBeGreaterThan(0);
  });
});
