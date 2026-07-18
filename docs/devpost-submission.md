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

Orders, returns, reviews, support tickets, and product-page copy usually live in separate tools. Community discussions from ecommerce operators repeatedly describe hidden margin pressure, vague return reasons, sizing confusion, and product promises that do not match the buying experience. The workaround is often a spreadsheet plus hours of manual reading.

We built CartCause to close the gap between a report and an operational decision.

### What it does

CartCause creates a daily profit-leak brief for a founder-led ecommerce store.

The demo opens on fictional sample data for Morrow Supply. It shows three precomputed leak candidates: a running shoe with a fit expectation gap, a weekender bag with a laptop-compartment mismatch, and a linen set with unclear dispatch timing.

GPT-5.6 ranks those candidates, forms bounded cause hypotheses, selects the exact return, review, support, and product-page evidence IDs behind each one, and drafts approval-ready changes. Every proposed fix carries its own evidence IDs. The owner can inspect the evidence, compare before and after copy, approve a fix, and download a structured human-review handoff.

The no-setup demo also includes a real normalized ingestion path: one click loads a fictional 14-column CSV template, the browser parses and validates it, recomputes return rates, and shows the candidate/evidence count. The raw file is never uploaded. Leakage estimates are labeled as unverified user inputs. After explicit redaction confirmation, its normalized fields can power the optional live request.

CartCause is not a chatbot or another broad dashboard. It is one daily loop: brief, evidence, approve.

### How we built it

The web app uses Vite, React, TypeScript, Tailwind CSS v4, Motion, and Phosphor Icons. A Vercel Function exposes `/api/analyze` and calls the OpenAI Responses API with `gpt-5.6`, medium reasoning, `store: false`, and Zod Structured Outputs.

The model never calculates the financial values shown in the interface. Estimated leakage is excluded from model input. The server binds `seeded_sample` to the exact known fictional dataset, labels every CSV packet `untrusted_normalized_csv`, verifies that return rate exactly matches `returns / orders`, requires a fictional/redacted and no-raw-file client attestation, and keeps money out of the model schema. After the response, it checks that every candidate appears exactly once, ranks are unique, every leak reference belongs to the correct candidate, and every fix cites only evidence already supporting its parent leak. Invalid references fail closed.

The default public UI sends only fictional Morrow Supply data. The optional importer accepts a bounded normalized CSV and requires a fictional/redacted-data acknowledgement; it is not a PII detector. The function converts the browser's random session ID into a pseudonymous hashed safety identifier and excludes the raw ID from the model input. A live API failure never disguises sample data as model output.

The public deployment uses a request-scoped bring-your-own-key flow. A key is held in React memory for the active tab, sent over HTTPS to the same-origin function for one OpenAI request, and cleared from the form before the fetch starts. CartCause application code does not write it to browser storage, cookies, the JSON body, a database, responses, or Vercel environment variables. The browser, serverless function, network path, and OpenAI necessarily process it transiently, so we tell evaluators to use a dedicated restricted key and revoke it after testing.

The file picker reads and validates the documented CSV schema locally. It rejects duplicate IDs, inconsistent metrics, unsupported evidence types, invalid bounds, and oversized packets. The raw file is never uploaded; only validated normalized fields can enter a confirmed live request. Real customer data, credentials, payment data, and full exports must not be used in this prototype.

CartCause sets `store: false`, which opts the request out of retrievable Responses application-state storage. It does not disable OpenAI's default abuse-monitoring logs. OpenAI states that API data is not used for training unless the API customer opts in, while abuse-monitoring data may generally be retained for up to 30 days under the project owner's data controls. The repository's detailed [security and data use guide](https://github.com/himomohi/cartcause/blob/master/docs/security-and-data.md) links the official policies and documents the complete request path.

The editorial campaign visual was produced with the built-in ImageGen tool and integrated into the actual product experience.

### How we used Codex

Codex was the primary build and coordination environment. We started from an empty project during Build Week. Codex inspected the official rules and Devpost form, researched current ecommerce-owner discussions, compared product wedges, coordinated bounded research/product/frontend/API/design agents, implemented and integrated the app, ran the test and browser loops, and prepared the deployment and submission assets.

The key human decision was the product pivot: move away from a developer tool and build a distinctive ecommerce operating brief for store owners. Human direction also set the trust boundary that financial inputs must stay outside model inference, imported estimates must be labeled, and recommendations must remain approval-only.

### Challenges we ran into

The hardest design problem was avoiding two familiar failure modes: a generic analytics dashboard and an AI copy generator. We narrowed the unit of value to one daily decision and made evidence references part of the primary UI.

The hardest technical problem was separating provided financial metrics from model inference. Structured Outputs solved shape, but shape alone was not enough. We added source-provenance checks, application-level reference validation, and a no-money response boundary.

We also caught a desktop breakpoint that squeezed the evidence story into unreadable strips, then rebuilt the lead composition as an editorial owner brief and reverified it in the browser.

### Accomplishments that we are proud of

- GPT-5.6 performs the central semantic synthesis instead of appearing as a chat add-on.
- Every model-supported hypothesis maps to visible evidence IDs.
- Every proposed fix shows the exact evidence IDs that support it.
- Financial arithmetic cannot be invented by the model response.
- The demo remains honest and useful if the live API is unavailable.
- A store owner can move from a normalized evidence packet to an approved JSON handoff in a single coherent flow.

### What we learned

Structured output is only the first trust layer. Products also need semantic validation for identity, ownership, and claims. We learned that an AI product feels more useful when the model boundary is visible and the experience ends with a controlled human decision.

### What's next for CartCause

The next step is a read-only Shopify connector for this normalized contract, followed by a human-reviewed draft action in a storefront or CX tool. We would add measurement only after the owner approval loop is proven. Auto-publishing, broad analytics, and unsupported ROI claims remain intentionally out of scope.

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
