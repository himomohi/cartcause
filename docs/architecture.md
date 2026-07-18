# CartCause Architecture

## Runtime shape

```text
Browser
  -> seeded or normalized ecommerce candidate metrics
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

The client owns metric display, candidate selection, evidence navigation, approval state, and implementation-brief copy. It never receives the OpenAI API key.

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

Server responsibilities:

1. Reject non-POST methods and invalid JSON.
2. Validate counts, types, bounded strings, and identifier uniqueness.
3. Hash the client session into a privacy-preserving safety identifier.
4. Call `openai.responses.parse` with `gpt-5.6`.
5. Use `zodTextFormat` for strict structured output.
6. Validate that every candidate appears exactly once and ranks are unique.
7. Validate that evidence references exist and belong to the cited candidate.
8. Return analysis without raw provider output or payload logs.
9. Map validation, configuration, rate-limit, refusal, provider, and unexpected failures to explicit safe errors.

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

- 400 invalid request
- 405 invalid method
- 429 upstream rate limit
- 502 refusal, invalid structured result, or provider failure
- 503 missing server configuration
- 500 unexpected failure

The seeded brief is always labeled as sample data. A live failure never silently replaces it with fabricated success.

## Security and privacy boundaries

- `.env` and all environment variants are ignored, except `.env.example`.
- Only the server reads `OPENAI_API_KEY`.
- No customer PII is required by the contract.
- Inputs are bounded and validated before the provider call.
- HTML is never injected from model or evidence text.
- The endpoint does not fetch user-provided URLs.
- Logs exclude raw evidence, model prompts, and credentials.
- The product does not write to a store or persist customer data.

## Deployment

- Vercel static deployment for the Vite client
- Vercel Function for `/api/analyze`
- production `OPENAI_API_KEY` configured in Vercel
- public app with no login
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
