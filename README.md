# CartCause

**One daily profit-leak brief with evidence-linked fixes for founder-led ecommerce stores.**

[Open the live demo](https://cartcause.vercel.app) · [Watch the 95-second walkthrough](https://youtu.be/Vzl6FUYech8) · [View on Devpost](https://devpost.com/software/cartcause)

![CartCause editorial concept](public/assets/cartcause-editorial.png)

## The problem

Ecommerce operators already have dashboards for orders, returns, reviews, and support. The harder problem is connecting those signals quickly enough to decide what to fix today.

Sizing confusion may appear in return reasons, product expectations in reviews, delivery questions in support notes, and the original promise on a product page. CartCause brings that fragmented evidence into one focused operating brief.

## Project overview

CartCause answers one morning question:

> Which product promise is most likely creating avoidable returns, what evidence supports that hypothesis, and what is the safest change to approve next?

CartCause follows a simple loop:

1. **Brief** — surface the highest-priority profit-leak candidates.
2. **Evidence** — connect each hypothesis to returns, reviews, support notes, and product-page promises.
3. **Fix** — compare the current experience with approval-ready product and CX changes.
4. **Approve** — export only owner-approved changes for downstream review.

CartCause is not a chatbot, a broad analytics suite, or an automatic storefront editor. It turns scattered evidence into one clear next action without silently publishing anything.

## What it does

- **Daily owner brief** prioritizes the most important candidate first.
- **Evidence View** keeps every cause hypothesis connected to visible source IDs.
- **Fix Studio** presents grounded before-and-after product and CX changes.
- **Approved today** collects selected changes into a structured implementation bundle.
- **Normalized CSV intake** demonstrates how a fictional or redacted evidence packet can enter the same decision flow.

The public demo opens with **Morrow Supply**, a clearly labeled fictional store, so the full brief, evidence, fix, and approval flow works without an account or API key.

## Why GPT-5.6 matters

GPT-5.6 performs the project's central semantic synthesis:

- ranking the supplied leak candidates;
- connecting qualitative signals across multiple evidence types;
- forming bounded cause hypotheses;
- selecting the evidence supporting each hypothesis;
- drafting grounded product-page and CX changes;
- stating what should not be claimed from the available evidence.

Provided financial values stay separate from model-authored recommendations. Every displayed suggestion remains attached to its supporting evidence and confidence boundary.

## Try CartCause

1. Open [cartcause.vercel.app](https://cartcause.vercel.app) and select **Review the top leak**.
2. Switch between the three ranked candidates and inspect their evidence.
3. Compare the current copy with the proposals in **Fix Studio**.
4. Approve a fix and download the approved implementation bundle.
5. Select **Load fictional template** to explore the normalized CSV path.

An optional live mode accepts a temporary user-provided OpenAI API key for a GPT-5.6 analysis. CartCause does not persist that key in app storage or a database. The raw CSV file remains local; only normalized fields can be included in an intentional live request.

Read the [security, API key, and data-use guide](docs/security-and-data.md) before using the optional live path.

## Project boundaries

- **Evidence before recommendation**
- **One decision instead of another dashboard**
- **Owner approval before export**
- **Useful without an API call**
- **No automatic storefront publishing**
- **No unsupported causal or ROI claims**

## Current scope

CartCause currently demonstrates the complete decision loop with fictional or redacted data. It does not yet connect to a commerce platform, edit a live storefront, manage customer accounts, or measure real-store outcomes.

The next step is a read-only Shopify connection feeding the same daily brief, followed by owner-approved draft actions in storefront and customer-experience tools.

## License

[MIT](LICENSE)
