# CartCause Product Brief

## Product decision

CartCause is a daily profit leak brief for founder-led ecommerce stores. It connects already-computed order and return metrics with the language hidden in reviews, return reasons, support notes, and product-page promises. GPT-5.6 ranks the likely causes, links every hypothesis to evidence, and drafts the smallest fixes an owner can approve today.

- Track: Work & Productivity
- Primary audience: owner-operators running a small or mid-sized direct-to-consumer store without a dedicated analyst
- Core promise: Find yesterday's preventable margin leaks before lunch.
- Primary outcome: move from fragmented store exports to one evidence-linked brief and an approved change set in under three minutes
- Working brand: CartCause

## The wedge

CartCause is not a general analytics dashboard, chatbot, returns portal, or copy generator. Its product unit is one daily operating decision:

> Which product promise leaked margin yesterday, what evidence supports that diagnosis, and what is the smallest safe change I can approve now?

Existing tools often separate revenue, returns, reviews, and customer support. Owners compensate with spreadsheets and manual reading. CartCause combines those signals without pretending the model can prove causality. Computed money stays deterministic; GPT-5.6 supplies semantic ranking, bounded hypotheses, evidence selection, and fix drafts.

## Core experience

### 1. Morning brief

- Shows one clearly labeled sample store and brief date
- Leads with total estimated leakage computed from the seeded inputs
- Ranks three candidate leaks by urgency
- Distinguishes computed metrics from GPT-5.6 analysis
- Provides one primary action: `Run live GPT-5.6 brief`

### 2. Evidence desk

- Opens the selected SKU or operating issue
- Shows return reasons, review excerpts, support notes, and the current product-page claim
- Uses stable evidence IDs that map directly to the model response
- Displays confidence and a required `what not to claim` boundary

### 3. Fix Studio

- Drafts a product-copy patch, sizing guidance, CX macro, or shipping notice
- Shows before and after text
- Explains why the fix is connected to the evidence
- Lets the owner approve or reject each proposal

### 4. Approved today

- Collects the accepted fixes into a compact implementation brief
- Copies a clean handoff for the store or CX team
- Does not auto-publish or modify a live storefront

## Seeded demonstration

The public demo uses a fictional store named `Morrow Supply` and explicitly labels every value as sample data.

| Candidate | Computed sample signal | Evidence pattern | Approval-ready fix |
|---|---|---|---|
| CloudForm Runner | $846 estimated leakage, 18.4% return rate vs 7.1% store baseline, 14 returns | Return and review language says the shoe runs small while the PDP says true to size | Fit warning, size-guide note, CX exchange macro |
| Transit Weekender | $517 estimated leakage, 7 refunds | Customers expected a padded 16-inch laptop compartment that the bag does not provide | Precise compartment dimensions and expectation-setting copy |
| Core Linen Set | $289 estimated leakage, 5 cancellation or refund cases | Support notes show unclear dispatch timing | Dispatch notice near the buy button and a shipping-response macro |

The sample total is $1,652. These are fictional computed inputs for product demonstration, not market claims.

## Three-minute demo story

1. Open Morrow Supply's morning brief.
2. Explain that CartCause has already computed the order and return metrics locally.
3. Run the live GPT-5.6 brief.
4. Open CloudForm Runner and inspect the evidence IDs behind the top hypothesis.
5. Compare the current `true to size` claim with the proposed fit patch.
6. Approve the product-copy fix and CX macro.
7. Copy the `Approved today` implementation brief.
8. Open the model-boundary note: arithmetic is deterministic, GPT-5.6 ranks evidence and drafts bounded fixes, and no customer PII is sent.

## Meaningful GPT-5.6 role

CartCause uses the Responses API with `gpt-5.6`, medium reasoning effort, `store: false`, and Zod Structured Outputs.

GPT-5.6 receives:

- pseudonymous store and session context
- precomputed per-candidate metrics
- bounded, redacted evidence excerpts
- current product copy and FAQ text
- stable candidate and evidence identifiers

GPT-5.6 returns:

- one ranked entry per candidate
- a concise owner-facing headline
- a bounded cause hypothesis
- confidence level
- evidence references drawn only from the provided IDs
- approval-ready fixes
- a `what_not_to_claim` boundary

The output schema contains no monetary field. The server validates candidate IDs, rank uniqueness, and evidence ownership before returning results. The browser merges model analysis with the original deterministic metrics.

## Trust and privacy boundary

- Customer names, emails, addresses, phone numbers, and full order records are never required.
- The demo sends only aggregates, short redacted excerpts, and pseudonymous identifiers.
- The OpenAI request uses `store: false`.
- The public demo uses a request-scoped bring-your-own-key flow: the key stays in tab memory only until the live request starts, travels only over HTTPS, and is never persisted.
- The model does not calculate or invent loss amounts.
- Every causal statement is framed as a hypothesis with confidence and evidence.
- A live API failure leaves the labeled sample brief intact and never masquerades as a successful model response.

## Visual direction

CartCause should feel like an owner opening a sharp morning trade brief, not logging into another SaaS dashboard.

- Deep evergreen ink, bone paper, coral loss signal, restrained acid-lime action accent
- Editorial display type paired with a clean operational sans
- One asymmetric brief composition instead of an equal-card grid
- A dense evidence rail and a focused Fix Studio
- Product swatches and generated campaign imagery used as supporting context, not decoration
- Motion only for analysis progress, leak selection, evidence reveal, and approval state
- Avoid AI-purple gradients, glassmorphism, decorative charts, generic chat bubbles, and invented performance claims

## Scope for Build Week

Ship:

- seeded Morrow Supply daily brief
- live GPT-5.6 structured analysis
- ranked leak selection and evidence mapping
- product-copy, sizing, CX, and shipping fix proposals
- approve, reject, and copy implementation brief actions
- model-boundary disclosure
- public responsive deployment with no login

Do not ship:

- Shopify or marketplace authentication
- automatic storefront publishing
- payments, billing, or accounts
- long-term analytics
- ad generation
- generalized store chat
- unsupported causal or ROI claims

## Judge-facing acceptance criteria

### Technological implementation

- A real GPT-5.6 call returns strict structured output.
- Monetary values shown in the UI originate only from validated input metrics.
- Every cited evidence ID maps to visible evidence for the same candidate.
- Invalid model references fail closed with a clear error.

### Design

- A first-time owner can identify the leading leak, inspect its evidence, and approve a fix within 30 seconds.
- The brief, evidence desk, Fix Studio, and approved tray form one coherent operating loop.
- Desktop and mobile preserve the same primary path.
- Keyboard, focus, contrast, and reduced motion are verified.

### Potential impact

- The product reduces the distance between fragmented evidence and a concrete store change.
- The story is legible to a solo owner without analytics vocabulary.
- The approach generalizes across physical-product ecommerce categories.

### Quality of idea

- The product ends in an approval-ready operational change, not another report.
- Evidence and inference are visibly separated.
- GPT-5.6 is central to the cross-source semantic synthesis.
- The scope remains one daily brief and one decision loop.
