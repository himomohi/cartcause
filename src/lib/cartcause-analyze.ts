import { createHash } from 'node:crypto'
import { z } from 'zod'

const MAX_SESSION_ID_LENGTH = 128
const MAX_STORE_NAME_LENGTH = 120
const MAX_DATE_LENGTH = 40
const MAX_CANDIDATES = 5
const MAX_ID_LENGTH = 64
const MAX_SKU_LENGTH = 80
const MAX_PRODUCT_NAME_LENGTH = 160
const MAX_EVIDENCE_EXCERPT_LENGTH = 600
const MAX_SOURCE_LABEL_LENGTH = 120
const MAX_COPY_FIELD_LENGTH = 3000
const MAX_SUMMARY_LENGTH = 700
const MAX_HEADLINE_LENGTH = 160
const MAX_HYPOTHESIS_LENGTH = 500
const MAX_CLAIM_GUARD_LENGTH = 400
const MAX_FIX_TITLE_LENGTH = 120
const MAX_FIX_TEXT_LENGTH = 500
const MAX_FIX_COUNT = 4
const MIN_EVIDENCE_PER_CANDIDATE = 2
const MAX_EVIDENCE_PER_CANDIDATE = 12
const MAX_REQUEST_BYTES = 250_000
const MONEY_PATTERN =
  /(?:\$|USD\b|US dollars?\b|dollars?\b|cents?\b|\b\d[\d,]*(?:\.\d+)?\s*(?:usd|dollars?|cents?)\b)/i

const boundedString = (max: number) => z.string().trim().min(1).max(max)
const boundedOptionalString = (max: number) => z.string().trim().max(max)

const EvidenceSchema = z
  .object({
    id: boundedString(MAX_ID_LENGTH),
    type: z.enum(['return', 'review', 'support', 'product_copy']),
    excerpt: boundedString(MAX_EVIDENCE_EXCERPT_LENGTH),
    sourceLabel: boundedString(MAX_SOURCE_LABEL_LENGTH),
  })
  .strict()

const CandidateSchema = z
  .object({
    id: boundedString(MAX_ID_LENGTH),
    product: z
      .object({
        sku: boundedString(MAX_SKU_LENGTH),
        name: boundedString(MAX_PRODUCT_NAME_LENGTH),
      })
      .strict(),
    computed: z
      .object({
        estimatedLeakageCents: z.number().int().min(0),
        orders: z.number().int().min(0),
        returns: z.number().int().min(0),
        returnRateBps: z.number().int().min(0).max(10_000),
        baselineReturnRateBps: z.number().int().min(0).max(10_000),
      })
      .strict()
      .superRefine((value, ctx) => {
        if (value.returns > value.orders) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'returns cannot exceed orders',
            path: ['returns'],
          })
        }
      }),
    evidence: z
      .array(EvidenceSchema)
      .min(MIN_EVIDENCE_PER_CANDIDATE)
      .max(MAX_EVIDENCE_PER_CANDIDATE)
      .superRefine((items, ctx) => {
        const ids = new Set<string>()

        for (const [index, item] of items.entries()) {
          if (ids.has(item.id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'evidence ids must be unique within a candidate',
              path: [index, 'id'],
            })
            continue
          }

          ids.add(item.id)
        }
      }),
    currentCopy: z
      .object({
        description: boundedOptionalString(MAX_COPY_FIELD_LENGTH),
        faq: boundedOptionalString(MAX_COPY_FIELD_LENGTH),
      })
      .strict(),
  })
  .strict()

export const AnalyzeRequestSchema = z
  .object({
    clientSessionId: boundedString(MAX_SESSION_ID_LENGTH),
    store: z
      .object({
        name: boundedString(MAX_STORE_NAME_LENGTH),
        currency: z.literal('USD'),
      })
      .strict(),
    briefDate: boundedString(MAX_DATE_LENGTH),
    candidates: z
      .array(CandidateSchema)
      .min(1)
      .max(MAX_CANDIDATES)
      .superRefine((items, ctx) => {
        const candidateIds = new Set<string>()
        const evidenceIds = new Set<string>()

        for (const [candidateIndex, candidate] of items.entries()) {
          if (candidateIds.has(candidate.id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'candidate ids must be unique',
              path: [candidateIndex, 'id'],
            })
          } else {
            candidateIds.add(candidate.id)
          }

          for (const [evidenceIndex, evidence] of candidate.evidence.entries()) {
            if (evidenceIds.has(evidence.id)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'evidence ids must be unique across all candidates',
                path: [candidateIndex, 'evidence', evidenceIndex, 'id'],
              })
            } else {
              evidenceIds.add(evidence.id)
            }
          }
        }
      }),
  })
  .strict()

const RecommendedFixSchema = z
  .object({
    type: z.enum(['product_copy', 'size_guide', 'cx_macro', 'shipping_notice']),
    title: boundedString(MAX_FIX_TITLE_LENGTH),
    rationale: boundedString(MAX_FIX_TEXT_LENGTH),
    before: boundedString(MAX_FIX_TEXT_LENGTH),
    after: boundedString(MAX_FIX_TEXT_LENGTH),
  })
  .strict()

const RankedLeakSchema = z
  .object({
    candidate_id: boundedString(MAX_ID_LENGTH),
    rank: z.number().int().min(1),
    headline: boundedString(MAX_HEADLINE_LENGTH),
    cause_hypothesis: boundedString(MAX_HYPOTHESIS_LENGTH),
    confidence: z.enum(['high', 'medium', 'low']),
    evidence_refs: z.array(boundedString(MAX_ID_LENGTH)).min(1).max(MAX_EVIDENCE_PER_CANDIDATE),
    recommended_fixes: z.array(RecommendedFixSchema).min(1).max(MAX_FIX_COUNT),
    what_not_to_claim: boundedString(MAX_CLAIM_GUARD_LENGTH),
  })
  .strict()

const ModelOutputSchema = z
  .object({
    owner_summary: boundedString(MAX_SUMMARY_LENGTH),
    ranked_leaks: z.array(RankedLeakSchema).min(1).max(MAX_CANDIDATES),
  })
  .strict()

export const AnalyzeSuccessSchema = z
  .object({
    analysis: ModelOutputSchema,
    meta: z
      .object({
        model: z.literal('gpt-5.6'),
        live: z.literal(true),
      })
      .strict(),
  })
  .strict()

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>
export type AnalyzeSuccessResponse = z.infer<typeof AnalyzeSuccessSchema>
export type ModelAnalysis = z.infer<typeof ModelOutputSchema>

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

export type SemanticValidationResult =
  | { ok: true; data: ModelAnalysis }
  | { ok: false; reason: string }

export const analyzeResponseFormat = ModelOutputSchema

export function getMaxRequestBytes(): number {
  return MAX_REQUEST_BYTES
}

export function parseAnalyzeRequest(input: unknown): ValidationResult<AnalyzeRequest> {
  const parsed = AnalyzeRequestSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid request body',
    }
  }

  return { ok: true, data: parsed.data }
}

export function createSafetyIdentifier(clientSessionId: string): string {
  return createHash('sha256').update(`cartcause:v1:${clientSessionId}`).digest('hex')
}

export function buildAnalyzeInstructions(candidateCount: number): string {
  return [
    'You are analyzing return-leak candidates for an ecommerce owner.',
    'Use only the supplied request JSON as evidence.',
    `Return exactly ${candidateCount} ranked leaks, one per candidate, with unique ranks 1 through ${candidateCount}.`,
    'Do not do arithmetic, do not estimate revenue, and do not mention money, dollars, cents, prices, or savings.',
    'Use only evidence_refs from the evidence IDs already provided for that exact candidate.',
    'Keep confidence grounded in the provided excerpts only.',
    'Recommended fixes must be concrete copy or CX changes, not general strategy.',
    'what_not_to_claim must explicitly limit unsupported promises or absolutes.',
  ].join(' ')
}

export function buildAnalyzeInput(request: AnalyzeRequest): string {
  return JSON.stringify({
    task: 'Rank likely causes of avoidable returns without using monetary claims.',
    rules: {
      noArithmetic: true,
      noMoneyLanguage: true,
      oneLeakPerCandidate: true,
      useOnlyProvidedEvidenceIds: true,
    },
    request,
  })
}

export function validateModelAnalysis(
  request: AnalyzeRequest,
  input: unknown,
): SemanticValidationResult {
  const parsed = ModelOutputSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Model output schema mismatch' }
  }

  const analysis = parsed.data

  if (analysis.ranked_leaks.length !== request.candidates.length) {
    return { ok: false, reason: 'Model output must include exactly one ranked leak per candidate' }
  }

  const candidateEvidenceMap = new Map(
    request.candidates.map((candidate) => [
      candidate.id,
      new Set(candidate.evidence.map((evidence) => evidence.id)),
    ]),
  )

  const seenCandidateIds = new Set<string>()
  const seenRanks = new Set<number>()

  for (const leak of analysis.ranked_leaks) {
    if (!candidateEvidenceMap.has(leak.candidate_id)) {
      return { ok: false, reason: 'Model output referenced an unknown candidate id' }
    }

    if (seenCandidateIds.has(leak.candidate_id)) {
      return { ok: false, reason: 'Model output must include each candidate exactly once' }
    }

    seenCandidateIds.add(leak.candidate_id)

    if (seenRanks.has(leak.rank)) {
      return { ok: false, reason: 'Model output ranks must be unique' }
    }

    seenRanks.add(leak.rank)

    const candidateEvidenceIds = candidateEvidenceMap.get(leak.candidate_id)!
    const localEvidenceRefs = new Set<string>()

    for (const evidenceRef of leak.evidence_refs) {
      if (!candidateEvidenceIds.has(evidenceRef)) {
        return { ok: false, reason: 'Model output referenced evidence outside the candidate scope' }
      }

      if (localEvidenceRefs.has(evidenceRef)) {
        return { ok: false, reason: 'Model output repeated an evidence reference' }
      }

      localEvidenceRefs.add(evidenceRef)
    }
  }

  for (let rank = 1; rank <= request.candidates.length; rank += 1) {
    if (!seenRanks.has(rank)) {
      return { ok: false, reason: 'Model output ranks must form a complete 1..N sequence' }
    }
  }

  if (containsMoneyLanguage(analysis)) {
    return { ok: false, reason: 'Model output must not contain monetary language' }
  }

  return { ok: true, data: analysis }
}

export function containsMoneyLanguage(value: unknown): boolean {
  if (typeof value === 'string') {
    return MONEY_PATTERN.test(value)
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsMoneyLanguage(item))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => containsMoneyLanguage(item))
  }

  return false
}
