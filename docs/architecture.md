# CartCause Architecture

## Runtime shape

```text
Browser
  -> seeded or normalized ecommerce candidate metrics
  -> request-scoped API key held in React memory until the live request starts
  -> POST /api/analyze
  -> Zod request validation
  -> OpenAI Responses API, model gpt-5.6
  -> strict structured semantic analysis
  -> candidate and evidence reference validation
  -> browser merges analysis with deterministic metrics
  -> evidence desk and fix approval UI
```

## Client

- Vite, React, and TypeScript
- Tailwind CSS v4 through the Vite plugin
- Motion for purposeful state transitions
- Phosphor icons with a consistent weight
- Seeded fictional store data for a no-login public demo
- Browser state for leak selection, live analysis, and approved fixes

The client owns metric display, candidate selection, evidence navigation, approval state, implementation-brief copy, and the temporary BYOK field. The key exists only in React memory for the current tab, is sent in the `x-openai-api-key` request header, and is cleared from React state as soon as the live request begins.

## Serverless endpoint

`POST /api/analyze`

Request fields:

- pseudonymous `clientSessionId`
- store name and currency
- brief date
- one to five leak candidates
- deterministic per-candidate metrics
- bounded evidence excerpts with typed IDs
- current product description and FAQ

Request header:

- `x-openai-api-key`: the user's request-scoped OpenAI key

Server responsibilities:

1. Reject non-POST methods, missing request keys, and invalid JSON.
2. Validate counts, types, bounded strings, and identifier uniqueness.
3. Instantiate the OpenAI client with the request-scoped key without persisting or logging it.
4. Hash the client session into a privacy-preserving safety identifier.
5. Call `openai.responses.parse` with `gpt-5.6`.
6. Use `zodTextFormat` for strict structured output.
7. Validate that every candidate appears exactly once and ranks are unique.
8. Validate that evidence references exist and belong to the cited candidate.
9. Return analysis without raw provider output, credentials, or payload logs, and mark responses `no-store`.
10. Map validation, rate-limit, refusal, provider, and unexpected failures to explicit safe errors.

## Model configuration

- Model: `gpt-5.6`
- API: Responses API
- Reasoning effort: `medium`
- Persistence: `store: false`
- Output: strict Zod Structured Output
- Safety identifier: SHA-256 hash of a bounded pseudonymous browser session ID

The prompt tells the model that arithmetic is outside its role. The output schema omits money, counts, and rates. GPT-5.6 ranks provided candidates, forms bounded hypotheses, selects evidence IDs, drafts minimal fixes, and states what not to claim.

## Shared validation

- `AnalyzeRequestSchema`
- `AnalysisSchema`
- `ApiSuccessSchema`
- `ApiErrorSchema`
- `validateAnalysisReferences`

Structured Outputs guarantee shape. Application validation additionally guarantees referential integrity.

## Reliability states

Client:

- sample
- analyzing
- live
- error with sample preserved

Server:

- 400 invalid request or missing request key
- 405 invalid method
- 429 upstream rate limit
- 502 refusal, invalid structured result, or provider failure
- 500 unexpected failure

The seeded brief is always labeled as sample data. A live failure never silently replaces it with fabricated success.

## Security and privacy boundaries

- The key is held only in React memory and is cleared as soon as a live request begins, on refresh, or on **Clear key**.
- Browser storage, cookies, database storage, and Vercel environment variables are not used for the key.
- The key is sent only from HTTPS origins, with localhost allowed for development.
- The server uses the request header only to instantiate the OpenAI client; it never logs or returns the key.
- The endpoint marks responses `Cache-Control: no-store` and `Pragma: no-cache`.
- No customer PII is required by the contract.
- Inputs are bounded and validated before the provider call.
- HTML is never injected from model or evidence text.
- The endpoint does not fetch user-provided URLs.
- Logs exclude raw evidence, model prompts, and credentials.
- The product does not write to a store or persist customer data.

## Deployment

- Vercel static deployment for the Vite client
- Vercel Function for `/api/analyze`
- public app with no login
- request-scoped bring-your-own-key access for live GPT-5.6 analysis
- fictional seeded data remains fully testable
- app remains available through the judging window

## Verification matrix

- Unit: request validation and semantic reference validation
- API: invalid method, body, key, reference, and upstream mappings
- Live API: real `gpt-5.6` output parsed and merged
- Build: TypeScript and Vite production build
- Browser: sample brief, live analysis, leak selection, evidence, approve, reject, copy
- Responsive: desktop, tablet, and narrow mobile
- Accessibility: landmarks, labels, keyboard order, focus, contrast, and reduced motion
