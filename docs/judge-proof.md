# CartCause Judge Proof Pack

Reviewed on July 18, 2026. This page separates repository evidence from live-runtime proof so a judge can verify the strongest claims quickly.

## 90-second no-key path

1. Open [cartcause.vercel.app](https://cartcause.vercel.app) and select **Review the top leak**.
2. Switch between the three ranked candidates. The evidence and fix panels must follow the selected SKU.
3. Approve one fix. Its button changes to **Approved**, an **Undo approval** action appears, and the approved count increments.
4. Select **Download approved patch bundle**. The handoff contains only human-approved fixes and explicitly requires destination-system review.
5. Select **Load fictional template** under **Normalized CSV intake**. The browser must report **3 candidates and 12 evidence excerpts** without calling `/api/analyze`.
6. Review the redaction acknowledgement. Do not enter a key: every step above is fully testable without one.

## Official judging criteria map

| Criterion | Judge-visible proof | Repository proof |
|---|---|---|
| Technological implementation | One-click CSV normalization, evidence-linked fixes, optional GPT-5.6 state, explicit failure state | `parseCartCauseCsv`, bounded Zod input/output, Responses API `gpt-5.6`, `store: false`, hashed safety identifier, leak-level and per-fix evidence validation, no-money guard |
| Design | Editorial first screen, above-fold primary CTA, ranked candidate → evidence → fix loop, clear approval state | Semantic landmarks, keyboard tab rail, visible focus, reduced-motion handling, responsive jump to Fix Studio |
| Potential impact | A solo merchant moves from fragmented evidence to a reviewable change packet in one session | Normalized input contract plus downloadable approved JSON handoff; no storefront write or invented ROI claim |
| Quality of idea | The product answers “what should I safely fix today?” rather than adding another dashboard or chatbot | Provided financial inputs are separated from GPT-5.6 semantic synthesis and every inference stays evidence-bounded |

## Technical proof

The live endpoint in [`api/analyze.ts`](../api/analyze.ts) performs one request-scoped OpenAI Responses API call with `model: "gpt-5.6"`, medium reasoning, strict Zod Structured Outputs, `store: false`, and a hashed pseudonymous `safety_identifier`.

Before any provider call, [`cartcause-analyze.ts`](../src/lib/cartcause-analyze.ts) binds `seeded_sample` to the exact server-known fictional dataset, labels every CSV request `untrusted_normalized_csv`, and validates the request shape, client data-use attestation, exact `returns / orders` rate, candidate/evidence uniqueness, numeric bounds, and request size. Estimated leakage is excluded from model input. After the call it fails closed unless:

- every candidate appears exactly once;
- ranks form a unique `1..N` sequence;
- leak evidence belongs to the cited candidate;
- every fix cites a non-empty subset of its parent leak evidence;
- no model-authored field contains monetary language.

The browser-side importer in [`cartcause-import.ts`](../src/lib/cartcause-import.ts) parses quoted CSV fields, limits the packet to 250 KB and five candidates, rejects duplicate evidence IDs and inconsistent repeated fields, and recomputes return rate from counts. The raw file is not uploaded. The exact fictional contract is downloadable as [`cartcause-sample-import.csv`](../public/cartcause-sample-import.csv).

## Verification evidence

Run from the repository root:

```bash
bun run test
bun run typecheck
bun run build
```

Current automated result: five test files and 24 tests pass. Coverage includes CSV parsing failures, imported-request routing, seeded-source binding, data-use attestation and rate consistency, BYOK clearing, API-key/header behavior, request validation, evidence crossing, per-fix grounding, and the no-money boundary.

Current browser evidence, verified locally in the in-app Browser on July 18, 2026:

- the primary CTA reaches the ranked-candidate flow;
- the fictional template normalizes to 3 candidates and 12 evidence excerpts;
- approving a fix changes the approval count and enables patch export;
- the key is not required for the complete seeded review and approval loop.

The optional live-success path was previously exercised against the GPT-5.6 API, but this proof pack does not ask judges to trust a fresh provider success without running it. Missing-key and malformed-request production failure paths are independently testable and fail with safe JSON errors.

## Trust boundary

- The default dataset and downloadable template are fictional.
- Imported packets require an explicit fictional/redacted-data acknowledgement before a live request.
- That acknowledgement is client-asserted rather than server proof; imported leakage estimates are user-supplied and not independently verified.
- The importer is not a PII detector; raw customer exports are prohibited.
- A BYOK key is transiently handled by the browser, CartCause function, hosting/network path, and OpenAI. Use only a dedicated restricted test key and revoke it afterward.
- CartCause does not auto-publish, persist customer data, or claim compliance certification.
- Deployment headers deny framing, suppress referrers, disable unnecessary browser permissions, and apply a restrictive CSP. These controls reduce risk but do not turn the prototype into a production secret-management system.

Read the complete [security, API key, and data-use guide](security-and-data.md) before using the optional live path.

## Known limitations

- No Shopify, helpdesk, or returns-platform authentication.
- No automatic redaction, tenant isolation, production rate limiting, or durable audit store.
- No automatic storefront publishing; the JSON bundle is intentionally a human-review handoff.
- No real-merchant outcome study or causal/ROI claim.
- Successful live GPT-5.6 execution depends on the evaluator's API project access and limits.
