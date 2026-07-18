# CartCause Devpost Submission Draft

## Project name

CartCause

## Elevator pitch

CartCause turns returns, reviews, support notes, and product promises into a daily profit-leak brief with evidence-linked fixes store owners can approve before lunch.

## Category

Work & Productivity

## Built with

- Codex
- GPT-5.6
- OpenAI Responses API
- Structured Outputs
- React
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Zod
- Vercel

## Project story

### Inspiration

Store owners rarely lack data. They lack one trusted answer to a much smaller morning question: what should I fix today?

Orders, returns, reviews, support tickets, and product-page copy usually live in separate tools. Connecting them often means a spreadsheet plus hours of manual reading—after the margin has already leaked.

We built CartCause to close the gap between a report and an operational decision: one evidence-backed change an owner can review before lunch.

### What it does

CartCause creates a daily profit-leak brief for founder-led ecommerce stores.

The demo opens with Morrow Supply, a clearly labeled fictional store. It surfaces three product-level leak candidates and brings the supporting returns, reviews, support notes, and product promises into one workspace.

GPT-5.6 ranks the candidates, forms bounded cause hypotheses, identifies the evidence behind each one, and drafts approval-ready product and CX changes. The owner can inspect every source, compare before and after copy, approve a fix, and download a structured handoff for human review.

The complete brief, evidence, and approval loop works without a key. A one-click fictional CSV template also demonstrates how a normalized evidence packet can enter the workflow locally in the browser.

CartCause is not a chatbot or another broad dashboard. It is one daily loop: brief, evidence, approve.

### How we built it

The web app uses Vite, React, TypeScript, Tailwind CSS v4, Motion, and Phosphor Icons. A Vercel Function calls the OpenAI Responses API with GPT-5.6 and Zod Structured Outputs.

GPT-5.6 handles the semantic synthesis—ranking candidates, connecting qualitative evidence, and drafting grounded fixes—while CartCause keeps the provided financial values outside model-authored output. Structured responses are validated before they reach the evidence and approval experience.

CartCause starts with fictional sample data and can optionally normalize a fictional or redacted CSV locally in the browser. The raw CSV file is not uploaded. The optional live path uses a user-provided OpenAI API key for the requested analysis and does not persist it in CartCause app storage or a database.

Only normalized fields can enter an intentional live request, which uses `store: false`. Suggested fixes remain approval-only drafts and are never auto-published. Full testing and data-use guidance remains available in the repository for evaluators who want the implementation detail.

The editorial campaign visual was produced with the built-in ImageGen tool and integrated into the actual product experience.

### How we used Codex

Codex was the primary build and coordination environment. We started from an empty project during Build Week. Codex helped research ecommerce-owner pain points, compare product directions, coordinate implementation and review work, run test and browser loops, and prepare the deployment and submission assets.

The key human decision was the product pivot: move away from a developer tool and build a distinctive ecommerce operating brief for store owners. Human direction also set the trust boundary that financial inputs must stay outside model inference, imported estimates must be labeled, and recommendations must remain approval-only.

### Challenges we ran into

The hardest design problem was avoiding two familiar failure modes: a generic analytics dashboard and an AI copy generator. We narrowed the unit of value to one daily decision and made evidence references part of the primary UI.

The hardest technical problem was separating provided financial metrics from model inference. Structured Outputs solved the response shape; the product still needed to ensure each recommendation stayed connected to the evidence shown to the owner.

We also caught a desktop breakpoint that squeezed the evidence story into unreadable strips, then rebuilt the lead composition as an editorial owner brief and reverified it in the browser.

### Accomplishments that we are proud of

- GPT-5.6 performs the central semantic synthesis instead of appearing as a chat add-on.
- Every model-supported hypothesis maps to visible evidence IDs.
- Every proposed fix shows the exact evidence IDs that support it.
- Provided financial values stay separate from model-authored recommendations.
- The demo remains honest and useful if the live API is unavailable.
- A store owner can move from a normalized evidence packet to an approved JSON handoff in a single coherent flow.

### What we learned

Structured output is only the first trust layer. We learned that an AI product feels more useful when its evidence is visible, its limits are understandable, and the experience ends with a controlled human decision.

### What's next for CartCause

The next step is a read-only Shopify connector feeding the same daily brief, followed by a human-reviewed draft action in a storefront or CX tool. We would add outcome measurement only after the approval loop is proven.

## Testing instructions

### Sample path — no key required

1. Open https://cartcause.vercel.app in a current desktop or mobile browser. No login is required.
2. Confirm that the app identifies Morrow Supply and labels the brief and financial values as fictional sample data.
3. Select each ranked leak candidate. Confirm that the Evidence and Fix Studio panels update to the same product.
4. Verify that every cause includes confidence, visible evidence IDs, and a `What not to claim` boundary.
5. Compare before/after copy, approve one fix, and confirm it appears in `Approved today`.
6. Select `Download approved patch bundle`, confirm the button changes only after approval, then use `Reset to sample brief`.
7. Select `Load fictional template` under `Normalized CSV intake`. Confirm that the browser reports 3 candidates and 12 evidence excerpts, then review the redaction acknowledgement without entering sensitive data.

### Optional live GPT-5.6 path

8. Use a dedicated OpenAI project key with GPT-5.6 access, minimal permissions, and a low budget or usage alert. Do not use a shared or broadly privileged production key.
9. Do not enter real customer PII, payment data, credentials, confidential text, or raw store exports. Use the seeded sample or fictional template.
10. If the template is loaded, confirm it is fictional/redacted. Paste the key into `Bring your own key` and select `Run live GPT-5.6 brief` over the HTTPS deployment.
11. Confirm that the key field clears as soon as the request starts. A retry intentionally requires re-entry.
12. On success, confirm the live label appears and every leak-level and per-fix evidence reference maps to the correct visible candidate.
13. Confirm that the financial values remain the provided inputs, imported leakage is labeled as unverified, and the model response contains no monetary field.
14. Reset to sample mode, delete or revoke the demonstration key, and review the OpenAI project's usage.

The raw CSV file is never uploaded; only validated normalized fields can be sent after explicit confirmation. A failed live request leaves the last valid brief intact. See the public [security and data use guide](https://github.com/himomohi/cartcause/blob/master/docs/security-and-data.md) for the complete data map, OpenAI retention note, error guide, and key-exposure response steps.

## URLs to complete

- Live app: https://cartcause.vercel.app
- Public repository: https://github.com/himomohi/cartcause
- Public YouTube demo: https://youtu.be/PDffqgURIDI
- Primary Codex `/feedback` Session ID: 019f740e-fa9f-7e82-b43f-1491c42322f5

## YouTube metadata

### Title

CartCause — GPT-5.6 Profit Leak Brief | OpenAI Build Week

### Description

CartCause turns ecommerce returns, reviews, support notes, and product promises into one daily profit-leak brief with evidence-linked, approval-ready fixes.

Live app: https://cartcause.vercel.app
Public repository: https://github.com/himomohi/cartcause

Built during OpenAI Build Week with Codex, GPT-5.6, the OpenAI Responses API, Structured Outputs, React, TypeScript, Vite, Tailwind CSS, and Vercel.

The optional live path uses a dedicated bring-your-own OpenAI API key. CartCause application code does not persist the key, clears it from the form when the request starts, and documents the transient browser, serverless, and provider handling in the repository security guide.

Narration uses an AI-generated OpenAI voice.
