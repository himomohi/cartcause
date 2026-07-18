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

The app uses a pseudonymous hashed safety identifier and sends no customer PII. A live API failure never disguises sample data as model output.

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

1. Open the public app. No login is required.
2. Review the clearly labeled Morrow Supply sample brief.
3. Choose any ranked leak candidate to update the evidence and Fix Studio panels.
4. Select `Run live GPT-5.6 brief` to replace the seeded semantic analysis with a live structured response.
5. Approve a fix and confirm it appears in `Approved today`.
6. Select `Copy implementation brief`.

The displayed financial values are fictional sample metrics. The live model response intentionally contains no monetary field.

## URLs to complete

- Live app:
- Public repository:
- Public YouTube demo:
- Primary Codex `/feedback` Session ID:
