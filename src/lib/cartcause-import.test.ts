import { describe, expect, it } from "vitest";
import { parseCartCauseCsv } from "./cartcause-import";

const header = [
  "store_name",
  "candidate_id",
  "sku",
  "product_name",
  "estimated_leakage_cents",
  "orders",
  "returns",
  "baseline_return_rate_bps",
  "evidence_id",
  "evidence_type",
  "evidence_excerpt",
  "source_label",
  "current_description",
  "current_faq",
].join(",");

describe("parseCartCauseCsv", () => {
  it("normalizes quoted evidence rows into one candidate", () => {
    const csv = [
      header,
      'Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-1,return,"Too small, even one size up",Return note,Current copy,Current FAQ',
      'Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-2,review,"Runs ""very"" small",Review,Current copy,Current FAQ',
    ].join("\n");

    const parsed = parseCartCauseCsv(csv);

    expect(parsed.store).toEqual({ name: "Demo Store", currency: "USD" });
    expect(parsed.rowCount).toBe(2);
    expect(parsed.evidenceCount).toBe(2);
    expect(parsed.candidates).toHaveLength(1);
    expect(parsed.candidates[0]?.computed.returnRateBps).toBe(2000);
    expect(parsed.candidates[0]?.evidence[0]?.excerpt).toBe(
      "Too small, even one size up",
    );
    expect(parsed.candidates[0]?.evidence[1]?.excerpt).toBe('Runs "very" small');
  });

  it("rejects duplicate evidence ids across candidates", () => {
    const csv = [
      header,
      "Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-1,return,Small,Return note,Copy,FAQ",
      "Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-2,review,Small,Review,Copy,FAQ",
      "Demo Store,item-b,SKU-B,Item B,900,10,1,500,E-1,return,Late,Return note,Copy,FAQ",
      "Demo Store,item-b,SKU-B,Item B,900,10,1,500,E-3,support,Late,Support,Copy,FAQ",
    ].join("\n");

    expect(() => parseCartCauseCsv(csv)).toThrow(
      "evidence_id must be unique across the file",
    );
  });

  it("rejects inconsistent repeated candidate metrics", () => {
    const csv = [
      header,
      "Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-1,return,Small,Return note,Copy,FAQ",
      "Demo Store,item-a,SKU-A,Item A,1200,11,2,500,E-2,review,Small,Review,Copy,FAQ",
    ].join("\n");

    expect(() => parseCartCauseCsv(csv)).toThrow(
      "repeated candidate fields must match earlier rows",
    );
  });

  it("requires at least two evidence rows per candidate", () => {
    const csv = [
      header,
      "Demo Store,item-a,SKU-A,Item A,1200,10,2,500,E-1,return,Small,Return note,Copy,FAQ",
    ].join("\n");

    expect(() => parseCartCauseCsv(csv)).toThrow(
      "must include 2 to 12 evidence rows",
    );
  });
});
