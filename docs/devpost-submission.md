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

GPT-5.6 ranks those candidates, forms bounded cause hypotheses, selects the exact return, review, support, and product-page evidence IDs behind each one, and drafts approval-ready changes. The owner can inspect the evidence, compare before and after copy, approve a fix, and copy a clean implementation handoff.

CartCause is not a chatbot or another broad dashboard. It is one daily loop: brief, evidence, approve.

### How we built it

The web app uses Vite, React, TypeScript, Tailwind CSS v4, Motion, and Phosphor Icons. A Vercel Function exposes `/api/analyze` and calls the OpenAI Responses API with `gpt-5.6`, medium reasoning, `store: false`, and Zod Structured Outputs.

The model never calculates the financial values shown in the interface. The server validates the deterministic candidate metrics before the call, and the model schema contains no money field. After the response, the server checks that every candidate appears exactly once, ranks are unique, and every evidence reference belongs to the correct candidate. Invalid references fail closed.

The current public UI sends only fictional Morrow Supply data. The function converts the browser's random session ID into a pseudonymous hashed safety identifier and excludes the raw ID from the model input. A live API failure never disguises sample data as model output.

The public deployment uses a request-scoped bring-your-own-key flow. A key is held in React memory for the active tab, sent over HTTPS to the same-origin function for one OpenAI request, and cleared from the form before the fetch starts. CartCause application code does not write it to browser storage, cookies, the JSON body, a database, responses, or Vercel environment variables. The browser, serverless function, network path, and OpenAI necessarily process it transiently, so we tell evaluators to use a dedicated restricted key and revoke it after testing.

The file picker is preview-only: it displays a filename and size but does not read or upload file contents. The generic endpoint has bounded fields and strict validation, but it is not a PII redactor. Real customer data, credentials, payment data, and full exports must not be used in this prototype.

CartCause sets `store: false`, which opts the request out of retrievable Responses application-state storage. It does not disable OpenAI's default abuse-monitoring logs. OpenAI states that API data is not used for training unless the API customer opts in, while abuse-monitoring data may generally be retained for up to 30 days under the project owner's data controls. The repository's detailed [security and data use guide](https://github.com/himomohi/cartcause/blob/master/docs/security-and-data.md) links the official policies and documents the complete request path.

The editorial campaign visual was produced with the built-in ImageGen tool and integrated into the actual product experience.

### How we used Codex

Codex was the primary build and coordination environment. We started from an empty project during Build Week. Codex inspected the official rules and Devpost form, researched current ecommerce-owner discussions, compared product wedges, coordinated bounded research/product/frontend/API/design agents, implemented and integrated the app, ran the test and browser loops, and prepared the deployment and submission assets.

The key human decision was the product pivot: move away from a developer tool and build a distinctive ecommerce operating brief for store owners. Human direction also set the trust boundary that arithmetic must stay deterministic and recommendations must remain approval-only.

### Challenges we ran into

The hardest design problem was avoiding two familiar failure modes: a generic analytics dashboard and an AI copy generator. We narrowed the unit of value to one daily decision and made evidence references part of the primary UI.

The hardest technical problem was separating deterministic financial metrics from model inference. Structured Outputs solved shape, but shape alone was not enough. We added application-level reference validation and a no-money response boundary.

We also caught a desktop breakpoint that squeezed the evidence story into unreadable strips, then rebuilt the lead composition as an editorial owner brief and reverified it in the browser.

### Accomplishments that we are proud of

- GPT-5.6 performs the central semantic synthesis instead of appearing as a chat add-on.
- Every model-supported hypothesis maps to visible evidence IDs.
- Financial arithmetic cannot be invented by the model response.
- The demo remains honest and useful if the live API is unavailable.
- A store owner can move from a leak candidate to an approved fix in a single coherent flow.

### What we learned

Structured output is only the first trust layer. Products also need semantic validation for identity, ownership, and claims. We learned that an AI product feels more useful when the model boundary is visible and the experience ends with a controlled human decision.

### What's next for CartCause

The next step is a privacy-preserving import flow for normalized store exports, followed by platform-specific connectors. We would add measurement only after the owner approval loop is proven. Auto-publishing, broad analytics, and unsupported ROI claims remain intentionally out of scope.

## Testing instructions

### Sample path — no key required

1. Open https://cartcause.vercel.app in a current desktop or mobile browser. No login is required.
2. Confirm that the app identifies Morrow Supply and labels the brief and financial values as fictional sample data.
3. Select each ranked leak candidate. Confirm that the Evidence and Fix Studio panels update to the same product.
4. Verify that every cause includes confidence, visible evidence IDs, and a `What not to claim` boundary.
5. Compare before/after copy, approve one fix, and confirm it appears in `Approved today`.
6. Select `Copy implementation brief`, then use `Reset to sample brief`.

### Optional live GPT-5.6 path

7. Use a dedicated OpenAI project key with GPT-5.6 access, minimal permissions, and a low budget or usage alert. Do not use a shared or broadly privileged production key.
8. Do not enter real customer PII, payment data, credentials, confidential text, or raw store exports. The public UI submits only fictional seeded data.
9. Paste the key into `Bring your own key` and select `Run live GPT-5.6 brief` over the HTTPS deployment.
10. Confirm that the key field clears as soon as the request starts. A retry intentionally requires re-entry.
11. On success, confirm the live label appears and every model evidence reference still maps to the correct visible candidate.
12. Confirm that the financial values remain the deterministic sample inputs; the model response contains no monetary field.
13. Reset to sample mode, delete or revoke the demonstration key, and review the OpenAI project's usage.

The upload control is preview-only and does not read or send file contents. A failed live request leaves the clearly labeled sample brief intact. See the public [security and data use guide](https://github.com/himomohi/cartcause/blob/master/docs/security-and-data.md) for the complete data map, OpenAI retention note, error guide, and key-exposure response steps.

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
