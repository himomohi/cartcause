# CartCause Security, API Key, and Data Use Guide

This guide explains the current public Build Week prototype at [cartcause.vercel.app](https://cartcause.vercel.app). It describes what the repository enforces, what data moves during a live analysis, and what remains the user's responsibility.

CartCause is a hackathon demonstration, not a production security, privacy, or compliance product. Use the fictional sample unless you have separately reviewed the live data flow.

## Safe-use checklist

Before running the optional live GPT-5.6 brief:

1. Use a personal device and a trusted browser profile.
2. Create a dedicated OpenAI project key for this demonstration. Do not use a broadly privileged or shared key.
3. Restrict the key's permissions where possible and configure a low project budget or usage alert.
4. Do not paste customer personal data, payment data, credentials, confidential contracts, or raw store exports into this prototype.
5. Keep the fictional Morrow Supply sample selected. The current public UI does not ingest real files.
6. Revoke or delete the demonstration key when testing is complete.

OpenAI recommends that production applications keep API keys out of client-side environments. CartCause's browser-entered bring-your-own-key flow is intentionally limited to this public hackathon demonstration. See OpenAI's [API key safety guidance](https://help.openai.com/en/articles/5112595) before using it.

## What each action does

| Action | Browser | CartCause serverless function | OpenAI |
|---|---|---|---|
| Open the demo | Loads the static app and fictional Morrow Supply dataset. Creates or reuses a random pseudonymous session ID in `localStorage`. | Does not run `/api/analyze`. Normal hosting infrastructure may still process the page request. | Receives nothing from CartCause. |
| Select a candidate | Changes local React state. | No request. | No request. |
| Approve or reject a fix | Stores the choice in memory for the current page session. | No request. | No request. |
| Copy the implementation brief | Builds the text in the browser and uses the Clipboard API. | No request. | No request. |
| Preview a file | Displays only the selected file's name and size. The current code does not read its contents or add it to the live request. | No upload request. | No upload request. |
| Run the live brief | Sends the fictional request body and API key to same-origin `/api/analyze` over HTTPS. | Validates the request, hashes the session ID, creates a request-scoped OpenAI client, and forwards the analysis input. | Processes the fictional candidate data and returns structured analysis. |

The sample experience does not need an API key. Sample content is not sent to OpenAI until the user explicitly selects **Run live GPT-5.6 brief**.

## Exactly what the live request sends

The current public UI constructs the request from the seeded fictional dataset. It sends:

- a random pseudonymous browser session ID to the CartCause function;
- the fictional store name and currency;
- the sample brief date;
- one to five candidate IDs, SKUs, and product names;
- deterministic sample counts, return rates, and leakage values;
- bounded return, review, support, and product-copy excerpts with source labels;
- the current fictional product description and FAQ.

The function uses the raw session ID only to create a SHA-256 safety identifier. The raw session ID is excluded from the model input; OpenAI receives the hash as `safety_identifier`.

The API accepts at most five candidates and a request body no larger than 250 KB. Evidence and copy fields also have explicit length limits. These bounds reduce accidental over-sharing, but they are not a personal-data detector or redaction system.

## API key lifecycle

The optional live flow handles the user's OpenAI API key as follows:

1. The key is typed into a password field and held in React memory for the current tab.
2. CartCause does not intentionally write the key to `localStorage`, `sessionStorage`, cookies, a database, the JSON request body, Vercel environment variables, or JSON responses.
3. The browser refuses live-key submission on plain HTTP, except for `localhost`, `127.0.0.1`, and `::1` during development.
4. When **Run live GPT-5.6 brief** is selected, the browser creates the request headers and body, then clears the key from visible React state before starting the fetch.
5. The key travels to same-origin `/api/analyze` in the `x-openai-api-key` request header.
6. The serverless function uses it to create one request-scoped OpenAI client. The key is used by the SDK to authenticate the upstream OpenAI request; it is not inserted into the model prompt.
7. The application contains no logger call for the key or request body, does not echo the key, and marks API success and error responses with `Cache-Control: no-store` and `Pragma: no-cache`.
8. A retry requires the user to enter the key again.

Selecting **Clear key**, refreshing the page, closing the tab, or starting a live request clears the key from the app's React state.

### Important limitations

“Not persisted by CartCause application code” is not the same as “impossible to observe.” While the key is present or in transit, it may be accessible to:

- the browser, browser developer tools, installed extensions, accessibility tools, or malware on the device;
- the CartCause serverless function and its hosting/network infrastructure while the request is processed;
- OpenAI's API infrastructure when the function authenticates the upstream request.

Clearing a form is not cryptographic memory erasure. The repository also cannot prove or control every diagnostic, proxy, network, or platform log outside the application code. Do not use this prototype on a shared or untrusted device, and do not use an irreplaceable production key.

## Data handling and OpenAI retention

CartCause calls the Responses API with `store: false`. This opts the request out of Responses application-state storage used to retrieve a response later. It does not by itself mean that no data can be retained anywhere.

According to OpenAI's current [API data controls documentation](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint):

- API inputs and outputs are not used to train OpenAI models unless the API customer explicitly opts in;
- abuse-monitoring logs may contain prompts, responses, or derived metadata and are generally retained for up to 30 days by default;
- eligible approved organizations can configure Modified Abuse Monitoring or Zero Data Retention;
- the API project owner's configured data controls govern the OpenAI portion of this request.

The data-control summary above was reviewed on July 18, 2026. OpenAI policies and account controls can change, so use the linked official documentation as the current source of truth.

CartCause has no application database and does not implement durable customer-data storage. Its function returns only the validated structured analysis, not the raw provider response. Hosting and API providers still process requests under their own operational and legal policies.

## Data you should not use

Do not adapt or test this public prototype with:

- customer names, email addresses, phone numbers, postal addresses, IP addresses, or account IDs;
- payment-card data, bank data, tax identifiers, or authentication credentials;
- health, biometric, children's, employment, or other sensitive personal data;
- API keys, passwords, access tokens, private URLs, or internal system prompts inside evidence text;
- full order exports, full support transcripts, raw reviews containing identity data, or confidential supplier contracts;
- data you do not have permission to process with CartCause, Vercel, and OpenAI.

For a real-store proof of concept, first create an offline normalized dataset containing only aggregates and short redacted excerpts. Replace names and stable customer identifiers, remove free-form signatures and contact details, and review every field before submission.

## Detailed usage

### A. Explore the sample without an API key

1. Open [cartcause.vercel.app](https://cartcause.vercel.app).
2. Confirm the interface identifies **Morrow Supply** and labels the metrics as sample data.
3. Read the headline leakage total. It is computed from fictional seeded values, not generated by GPT-5.6.
4. Select each ranked candidate in the leak rail.
5. In **Evidence**, review the visible return, review, support, and product-page evidence IDs.
6. Read the cause hypothesis, confidence, and **What not to claim** boundary.
7. In **Fix Studio**, compare the current copy with each proposed replacement.
8. Select **Approve fix** or **Reject**. This changes browser state only and does not publish anything.
9. Review the accepted items in **Approved today**.
10. Select **Copy implementation brief** to copy the handoff text to the clipboard.
11. Select **Reset to sample brief** at any time to restore the seeded analysis.

### B. Run the optional live GPT-5.6 brief safely

1. Sign in to the OpenAI Platform and create a dedicated project key from the [API keys page](https://platform.openai.com/api-keys).
2. Give the key only the access needed for this test where project controls allow it.
3. Set a low project budget or usage alert, and keep the OpenAI usage page available for review.
4. Use a trusted browser profile with no unnecessary extensions. Do not use a public or shared computer.
5. Open CartCause over `https://cartcause.vercel.app`. Live submission is intentionally blocked on non-HTTPS public origins.
6. Locate **Bring your own key** in the owner brief.
7. Paste the dedicated key into **OpenAI API key**. Avoid using **Show** where someone can see or record the screen.
8. Confirm the app says the key is ready for one request.
9. Select **Run live GPT-5.6 brief**.
10. Confirm that the key field clears as soon as the request starts. This is expected and prevents an accidental second use from the form.
11. Wait for the live status. If the provider succeeds, the interface labels the result as a live GPT-5.6 analysis.
12. Open each candidate and verify that every cited evidence ID exists in that candidate's evidence panel.
13. Treat every cause as a hypothesis, not proven causation. Review confidence and **What not to claim** before approving a change.
14. Confirm that the financial values remain the original deterministic sample values; the model output has no money field.
15. Approve only the fixes you would be comfortable handing to a human storefront or CX operator. CartCause does not auto-publish them.
16. Copy the implementation brief if desired.
17. Select **Reset to sample brief** to leave live mode.
18. Delete or revoke the demonstration key from the [API keys page](https://platform.openai.com/api-keys), then review API usage for unexpected requests. OpenAI documents key deletion in [this help article](https://help.openai.com/en/articles/9047852).

### C. Understand the upload preview

1. Selecting **Add returns export** opens the browser's file picker.
2. The current prototype records only the chosen file's name and size for a visual preview.
3. It does not read, parse, upload, or include the file contents in `/api/analyze`.
4. Do not interpret a preview as successful import or analysis. Real ingestion is explicitly out of scope for this version.

## Troubleshooting

| Symptom | Meaning | Safe next step |
|---|---|---|
| The app asks for a key | Live mode is optional and no key is in the current tab state. | Continue in sample mode or enter a dedicated temporary key. |
| The key disappears after selecting Run | Expected behavior. The key is cleared from the form before the request starts. | Re-enter it only if you intentionally retry. |
| “Live key submission requires HTTPS” | The public page is not using a secure origin. | Use the official HTTPS URL. Plain HTTP is allowed only for local development. |
| HTTP 400 | The key is missing, JSON is invalid, or the bounded request contract was rejected. | Re-enter the key and return to the unchanged sample data. Do not weaken validation. |
| HTTP 429 | The OpenAI project is rate-limited. | Stop retrying, review usage and limits, and try later if appropriate. |
| HTTP 502 | OpenAI refused, failed, or returned an invalid structured result. | Keep the sample brief, check project/model access, and retry only after reviewing the cause. |
| HTTP 500 | An unexpected server error occurred. | Do not repeatedly submit the key. Return to sample mode and report the failure without sharing the key. |
| Copy fails | Clipboard access was rejected or the page lacks a secure context. | Use the HTTPS deployment and retry after granting clipboard permission. |
| File selection shows only a name and size | The upload control is preview-only. | Do not expect the file to affect analysis. |

Live failures never silently replace the sample brief with fabricated success.

## If a key may be exposed

1. Delete or rotate the key immediately from the [OpenAI API keys page](https://platform.openai.com/api-keys).
2. Review OpenAI project usage and billing for unfamiliar activity.
3. Lower or disable the affected project's budget while investigating.
4. Create a new key only after the device, browser profile, extensions, and sharing path have been reviewed.
5. Never paste the exposed key into a bug report, screenshot, commit, issue, or chat message.

OpenAI's official [API key safety guidance](https://help.openai.com/en/articles/5112595) contains the current provider-side recommendations.

## Production-readiness gaps

Before using CartCause with real commerce data, a production implementation would need at least:

- server-owned secret management instead of browser-entered BYOK;
- authentication, authorization, tenant isolation, rate limiting, and abuse controls;
- documented infrastructure logging and secret-redaction controls;
- automated personal-data detection and redaction plus a reviewed import schema;
- consent, deletion, retention, residency, vendor, and incident-response policies;
- security headers and a deployment-specific content security policy;
- audit logging that records safe events without credentials or raw customer text;
- a threat model, penetration testing, dependency review, and operational monitoring;
- legal and compliance review appropriate to the store, customers, and jurisdictions.

The current prototype makes no claim of PCI DSS, HIPAA, GDPR, CCPA/CPRA, SOC 2, ISO 27001, or other compliance certification.

## Repository-enforced safeguards

- strict Zod validation for request and response shapes;
- a 250 KB body limit and bounded candidate/evidence fields;
- unique candidate and evidence identifiers;
- HTTPS-only live-key submission outside localhost;
- request-scoped OpenAI client construction;
- `store: false` on the Responses API call;
- pseudonymous SHA-256 `safety_identifier` with the raw browser session ID omitted from model input;
- structured output plus a second semantic validation pass;
- evidence ownership, complete ranking, and no-money-output checks;
- `no-store` API responses and safe public error messages;
- no automatic storefront writes or publishing.

These controls reduce risk; they do not remove the prototype limitations described above.
