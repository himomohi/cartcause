# CartCause

**One daily profit-leak brief with evidence-linked fixes for founder-led ecommerce stores.**

[Open the live demo](https://cartcause.vercel.app) · [Watch the 2-minute product demo](https://youtu.be/PDffqgURIDI) · [View the Devpost submission](https://devpost.com/software/cartcause)

![CartCause editorial concept](public/assets/cartcause-editorial.png)

Ecommerce operators already have dashboards for orders, returns, reviews, and support. The harder problem is deciding what to fix today.

CartCause turns those fragmented signals into a focused morning brief. GPT-5.6 ranks likely profit-leak causes, links every hypothesis and suggested fix to visible evidence, and prepares the smallest product or customer-experience change an owner can review before lunch.

## One decision, not another dashboard

> Which product promise is most likely creating avoidable returns, what evidence supports that hypothesis, and what is the safest change to approve next?

CartCause is built around that single operating loop:

1. **Brief** — surface the highest-priority leak candidates.
2. **Evidence** — connect each hypothesis to returns, reviews, support notes, and product-page promises.
3. **Fix** — compare approval-ready product and CX changes with the current copy.
4. **Approve** — export only the changes a human selected for downstream review.

It is not a chatbot, a broad analytics suite, or an automatic storefront editor. CartCause ends with a human decision, never a silent publish.

## Try it in 90 seconds

The public demo starts with **Morrow Supply**, a clearly labeled fictional store. No login or API key is required.

1. Open [cartcause.vercel.app](https://cartcause.vercel.app) and select **Review the top leak**.
2. Switch between the three ranked candidates and inspect their evidence.
3. Compare the current copy with the proposals in **Fix Studio**.
4. Approve one fix and download the human-review patch bundle.
5. Select **Load fictional template** to normalize a sample CSV locally in the browser.

### Optional live GPT-5.6 mode

For a live analysis, use a dedicated temporary OpenAI project key and only fictional or carefully redacted data. Paste the key into **Bring your own key**, run the brief once, then revoke the demonstration key after testing.

CartCause starts with fictional sample data and can optionally normalize a fictional or redacted CSV locally in your browser. The live flow uses a user-provided OpenAI API key that CartCause does not persist in app storage or a database. It sends only the current normalized fields—not the raw CSV file—through `/api/analyze` with `store: false`. Suggested fixes remain human-review drafts and are never auto-published.

Read the [security, API key, and data-use guide](docs/security-and-data.md) before using the optional live path.

## Why GPT-5.6 matters

The model performs the product's central semantic work:

- ranks the supplied leak candidates;
- turns fragmented qualitative signals into bounded cause hypotheses;
- selects the evidence supporting each hypothesis;
- drafts product-page and CX changes grounded in that evidence;
- states what the owner should not claim from the available data.

Financial inputs stay separate from model-authored output. CartCause validates the structured response before showing it and keeps the original metrics attached to the brief. This lets GPT-5.6 focus on synthesis while the product retains a clear operational boundary.

## Product principles

- **Evidence before recommendation** — every hypothesis and fix points back to visible source IDs.
- **One decision by lunch** — the interface prioritizes action over another analytics workspace.
- **Human approval by default** — no storefront write or automatic publishing exists.
- **Useful without an API call** — the complete review and approval loop works on fictional sample data.
- **Honest boundaries** — imported estimates are labeled as provided inputs, and hypotheses are never presented as proven causation.

## Architecture

```text
React app → Vercel Function → OpenAI Responses API → evidence desk → owner approval → JSON handoff
```

Built with Vite, React, TypeScript, Tailwind CSS v4, Motion, Phosphor Icons, the OpenAI JavaScript SDK, Zod, Vercel Functions, Vitest, and Testing Library.

The optional live endpoint uses GPT-5.6 with Structured Outputs, medium reasoning, and `store: false`. The public deployment uses request-scoped bring-your-own-key access rather than a shared server key.

## Local development

Requirements:

- Bun 1.3+
- an OpenAI project key with GPT-5.6 access only if you want to test live mode

```bash
bun install
bun run dev
```

The seeded experience works without a key. Enter a dedicated test key in the app when intentionally exercising the live endpoint; no server-side `OPENAI_API_KEY` is required for the public BYOK flow.

## Verification

```bash
bun run test
bun run typecheck
bun run build
```

The current suite contains 24 tests covering the seeded brief, normalized CSV intake, request and response boundaries, evidence ownership, approval flow, and API-key handling. Automated tests do not call OpenAI; live provider access still depends on the evaluator's project permissions and limits.

## Built during OpenAI Build Week

CartCause started from an empty project during Build Week. Codex was the primary build and coordination environment: it supported product research, implementation, testing, design review, deployment, and submission preparation.

The decisive product choices remained human-directed: pivot to ecommerce operators, focus on one daily decision, keep financial values outside model-authored output, require visible evidence, and stop at owner approval.

## Current scope and next step

This is a public hackathon prototype built around fictional or redacted data. It does not include Shopify authentication, customer accounts, automatic publishing, billing, or durable customer-data storage.

The next product step is a read-only Shopify connector feeding the same daily brief, followed by a human-reviewed draft action in a storefront or CX tool. Real outcome measurement comes after the approval loop is proven.

## Documentation

- [Security, API key, data use, and detailed usage](docs/security-and-data.md)
- [Architecture](docs/architecture.md)
- [Judge proof pack](docs/judge-proof.md)
- [Product brief](docs/product-brief.md)

## License

[MIT](LICENSE)
