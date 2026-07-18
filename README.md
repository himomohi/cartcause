# CartCause

**Daily profit leak brief with approve-ready fixes for founder-led ecommerce stores.**

[Open the live CartCause demo](https://cartcause.vercel.app) · [Watch the 2-minute product demo](https://youtu.be/PDffqgURIDI)

![CartCause editorial concept](public/assets/cartcause-editorial.png)

CartCause connects provided order, return, and leakage inputs with the language hidden in reviews, support notes, return reasons, and product-page promises. GPT-5.6 ranks the likely causes, cites the evidence behind each hypothesis, and drafts the smallest product-page or CX changes an owner can approve today.

The public demo opens with a fictional store named **Morrow Supply**. Every seeded order count, rate, and dollar value is explicitly sample data. A normalized CSV can also be parsed and validated locally before an optional live run. Read the [security, API key, and data use guide](docs/security-and-data.md) before using that path.

## Why CartCause

Revenue dashboards show what happened. Returns tools process what happened. CartCause is focused on the decision in between:

> Which product promise likely leaked margin yesterday, what evidence supports that hypothesis, and what is the smallest safe fix to approve now?

The product is intentionally not a chatbot, general analytics suite, return portal, or automatic storefront editor. It produces one evidence-linked morning brief and ends with an owner-approved implementation handoff.

## How to use CartCause

### Explore the sample without an API key

1. Open the [public app](https://cartcause.vercel.app). No login or API key is required.
2. Confirm that the brief is labeled **Morrow Supply** and **sample data**.
3. Select any ranked leak candidate in the left rail.
4. Inspect the return, review, support, and product-page evidence IDs behind its hypothesis.
5. Read the confidence level and **What not to claim** boundary.
6. Compare the current copy with each proposal in **Fix Studio**.
7. Approve or reject a fix. This changes browser state only; CartCause never edits a storefront.
8. Review accepted changes in **Approved today**, then copy the brief or download the human-approved JSON patch bundle.
9. Select **Reset to sample brief** to restore the seeded analysis at any time.

### Run the optional live GPT-5.6 brief

1. Create a dedicated, restricted project key from the [OpenAI API keys page](https://platform.openai.com/api-keys). Use a low project budget or usage alert and plan to revoke the key after the demo.
2. Use a trusted browser profile and the HTTPS deployment. Do not use a shared device, a broadly privileged key, or sensitive customer data.
3. Paste the key into **Bring your own key**, then select **Run live GPT-5.6 brief**.
4. The browser sends the fictional dataset and key to same-origin `/api/analyze`. The function validates the request and uses the key for one OpenAI request.
5. The key field clears before the fetch starts. Re-entering the key is required for any intentional retry.
6. When live mode succeeds, verify that every cited evidence ID belongs to the selected candidate and treat every cause as a hypothesis rather than proven causation.
7. Approve only human-reviewed changes, copy the implementation brief if desired, and reset to sample mode.
8. Delete or revoke the demonstration key, then review the OpenAI project's usage.

### Use the normalized CSV intake

1. Select **Load fictional template** for the no-setup judge path, or download the template and replace only its fictional normalized fields.
2. CartCause reads the CSV in the browser, validates its schema and bounds, recomputes return rates locally, and shows the candidate/evidence count. The raw file is never uploaded. Leakage estimates remain user-supplied CSV inputs and are labeled as unverified.
3. Confirm that the packet is fictional or redacted. This acknowledgement is required before an imported packet can be sent.
4. If you intentionally run live analysis, only the normalized store, candidate, metric, copy, and evidence fields are included in `/api/analyze`—not the raw file.

The importer is not a PII detector. Never use raw customer exports or sensitive data. See [`public/cartcause-sample-import.csv`](public/cartcause-sample-import.csv) for the exact 14-column contract.

The [complete usage guide](docs/security-and-data.md#detailed-usage) includes a field-by-field data map, safe testing checklist, error explanations, incident steps, and production-readiness limits.

## GPT-5.6 integration

The serverless `/api/analyze` endpoint uses the OpenAI Responses API with:

- model alias `gpt-5.6`
- medium reasoning effort
- `store: false`
- a request-scoped API key supplied by the user at run time
- a pseudonymous hashed `safety_identifier`
- Zod Structured Outputs through `zodTextFormat`

GPT-5.6 does **not** calculate money, counts, or rates. Estimated leakage is excluded from model input, and the structured output schema contains no monetary field. The model returns one ranked analysis per candidate, a bounded cause hypothesis, confidence, evidence references, recommended fixes, and a `what_not_to_claim` guardrail.

The server performs a second semantic validation pass:

- the `seeded_sample` source must exactly match the server-known fictional dataset; every CSV request is labeled `untrusted_normalized_csv`
- declared data use must be fictional/redacted and must state that no raw file was uploaded; this remains a client attestation, not proof of redaction
- imported return rate must exactly equal `returns / orders`
- every candidate must appear exactly once
- ranks must be a unique `1..N` sequence
- every evidence ID must exist and belong to the cited candidate
- every proposed fix must cite its own evidence, and those IDs must already support the parent leak
- the response must not contain monetary language

The browser then merges the validated analysis with the original provided metrics. Return rates are recomputed and server-checked; imported leakage estimates are user-supplied and not independently verified.

`store: false` opts this request out of retrievable Responses application-state storage. It does not disable OpenAI's default abuse-monitoring logs. OpenAI states that API data is not used for model training unless the API customer opts in, while abuse-monitoring data may generally be retained for up to 30 days. The key owner's project data controls govern that provider-side processing; see [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint).

## Architecture

```text
React browser app
  -> fictional or locally normalized candidate metrics and redacted evidence
  -> request-scoped API key held in tab memory
  -> HTTPS POST /api/analyze with key in a request header
  -> Zod request validation
  -> pseudonymous session ID hashed and omitted from model input
  -> OpenAI Responses API with GPT-5.6
  -> strict structured output
  -> semantic reference validation
  -> evidence desk and owner approval flow
```

Stack:

- Vite, React, and TypeScript
- Tailwind CSS v4
- Motion
- Phosphor Icons
- OpenAI JavaScript SDK
- Zod
- Vercel Functions
- Vitest and Testing Library

## Trust boundary

- The default public path sends only the fictional Morrow Supply dataset. The optional CSV path accepts a bounded normalized schema and requires a redaction acknowledgement, but it cannot detect PII automatically.
- The public demo uses bring-your-own-key access: the key stays in React memory, travels over HTTPS through CartCause's serverless function for one OpenAI request, and is cleared from the form before the fetch starts.
- CartCause application code does not write the key to browser storage, cookies, the JSON body, a database, responses, or Vercel environment variables. The repository contains no application logger call for the key or request body.
- A random pseudonymous session ID is stored in `localStorage` for safety-abuse correlation. The function hashes it for `safety_identifier`, and the raw value is omitted from the model input.
- Browsers, extensions, developer tools, compromised devices, hosting/network infrastructure, and OpenAI may still observe data transiently while handling a live request. Clearing the form is not cryptographic memory erasure.
- A failed live request leaves the clearly labeled sample brief intact.
- CartCause does not write to a store, auto-publish changes, or persist customer data.
- Model hypotheses always include confidence, evidence IDs, and a limit on what may be claimed.

This is a public hackathon prototype, not a compliance-certified production service. Use only fictional, anonymized, aggregated, or carefully redacted data. Never submit customer PII, payment data, credentials, confidential exports, or content you are not authorized to process. OpenAI recommends keeping production API keys out of client-side environments; review its [API key safety guidance](https://help.openai.com/en/articles/5112595) and the project's [full security guide](docs/security-and-data.md).

## Local setup

Requirements:

- Bun 1.3+
- an OpenAI API key with access to GPT-5.6 for the optional live brief

```bash
bun install
bun run dev
```

The static sample experience runs without a key. In the deployed app, paste a dedicated demonstration key into **Bring your own key** to exercise `/api/analyze`. The browser clears it from React state when the request starts, but the key is necessarily handled transiently by the browser, CartCause function, network path, and OpenAI. Use a serverless-compatible local runtime to exercise the same endpoint locally.

The public deployment does not require a server-side `OPENAI_API_KEY` environment variable.

## Verification

```bash
bun run test
bun run typecheck
bun run build
```

The automated suite covers seeded-data arithmetic, normalized CSV parsing, imported-request routing, request validation, identifier uniqueness, leak-level and per-fix evidence ownership, rank integrity, BYOK clearing, and the no-money model-output boundary. These tests do not call OpenAI. During development, a separate live contract run against `gpt-5.6` returned a valid parsed result; evaluators should treat fresh provider success as dependent on their own project access and limits.

## How Codex accelerated the build

Codex served as the primary build environment and coordination layer during OpenAI Build Week. The project was created from an empty directory during the event. Codex helped:

- inspect the official rules and submission form
- research current ecommerce-owner discussions on Reddit, Shopify Community, and X
- compare three product wedges before selecting the daily margin-leak brief
- coordinate bounded product, research, frontend, API, and design-review agents
- implement the React experience and GPT-5.6 contract in parallel
- run tests, browser interaction checks, accessibility review, and production builds
- create the editorial campaign visual with the built-in ImageGen tool

## Human decisions

The human-directed decisions that shaped the product were:

- change the original developer-tool direction into an ecommerce product for store owners
- make GPT-5.6 a real API feature, not only a build-time assistant
- focus on one daily operating decision instead of a broad analytics suite
- keep financial arithmetic outside the model and label imported estimates honestly
- require evidence references and an explicit claim boundary
- stop at owner approval instead of automatically editing a live storefront

## Build Week scope

This repository is a new Build Week project. The public demo deliberately starts with fictional data, includes bounded browser-side CSV normalization and an approved JSON handoff, and excludes commerce-platform authentication, automatic publishing, billing, accounts, and durable customer storage.

For a fast evidence map, see the [judge proof pack](docs/judge-proof.md). Additional product, architecture, research, demo, submission, and [security/data-use](docs/security-and-data.md) notes are in [`docs/`](docs/).

## License

[MIT](LICENSE)
