import { describe, expect, it } from 'vitest'

import {
  analyzeApiKeyHeader,
  buildAnalyzeInput,
  createSafetyIdentifier,
  parseAnalyzeApiKeyHeader,
  parseAnalyzeRequest,
  validateModelAnalysis,
} from './cartcause-analyze'

const validRequest = {
  clientSessionId: 'session_123',
  store: {
    name: 'CartCause Demo',
    currency: 'USD' as const,
  },
  briefDate: '2026-07-18',
  candidates: [
    {
      id: 'cand_a',
      product: {
        sku: 'SKU-A',
        name: 'Trail Shoe',
      },
      computed: {
        estimatedLeakageCents: 120000,
        orders: 100,
        returns: 12,
        returnRateBps: 1200,
        baselineReturnRateBps: 700,
      },
      evidence: [
        {
          id: 'ev_a_1',
          type: 'review' as const,
          excerpt: 'Runs narrow in the toe box.',
          sourceLabel: 'Review 1',
        },
        {
          id: 'ev_a_2',
          type: 'support' as const,
          excerpt: 'Customers ask whether they should size up.',
          sourceLabel: 'Support Macro',
        },
      ],
      currentCopy: {
        description: 'Lightweight running shoe.',
        faq: 'Ships in 2 days.',
      },
    },
    {
      id: 'cand_b',
      product: {
        sku: 'SKU-B',
        name: 'Travel Mug',
      },
      computed: {
        estimatedLeakageCents: 90000,
        orders: 80,
        returns: 9,
        returnRateBps: 1125,
        baselineReturnRateBps: 600,
      },
      evidence: [
        {
          id: 'ev_b_1',
          type: 'review' as const,
          excerpt: 'The lid leaks if the mug tips in a bag.',
          sourceLabel: 'Review 4',
        },
        {
          id: 'ev_b_2',
          type: 'product_copy' as const,
          excerpt: 'Marketing says spill-proof for commuting.',
          sourceLabel: 'PDP Hero',
        },
      ],
      currentCopy: {
        description: 'Insulated mug for daily commutes.',
        faq: 'Dishwasher safe on top rack.',
      },
    },
  ],
}

describe('parseAnalyzeRequest', () => {
  it('accepts a valid request and builds stable derived values', () => {
    const parsed = parseAnalyzeRequest(validRequest)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    expect(createSafetyIdentifier(parsed.data.clientSessionId)).toHaveLength(64)
    expect(createSafetyIdentifier(parsed.data.clientSessionId)).toBe(
      createSafetyIdentifier(parsed.data.clientSessionId),
    )
    const modelInput = buildAnalyzeInput(parsed.data)
    expect(modelInput).toContain('"oneLeakPerCandidate":true')
    expect(modelInput).not.toContain(parsed.data.clientSessionId)
    expect(modelInput).not.toContain('"clientSessionId"')
  })

  it('rejects duplicate candidate ids', () => {
    const parsed = parseAnalyzeRequest({
      ...validRequest,
      candidates: [validRequest.candidates[0], validRequest.candidates[0]],
    })

    expect(parsed.ok).toBe(false)
  })

  it('rejects duplicate evidence ids across candidates', () => {
    const parsed = parseAnalyzeRequest({
      ...validRequest,
      candidates: [
        validRequest.candidates[0],
        {
          ...validRequest.candidates[1],
          evidence: [
            {
              ...validRequest.candidates[1].evidence[0],
              id: 'ev_a_1',
            },
            validRequest.candidates[1].evidence[1],
          ],
        },
      ],
    })

    expect(parsed.ok).toBe(false)
  })
})

describe('parseAnalyzeApiKeyHeader', () => {
  it('accepts a trimmed request-scoped api key', () => {
    const parsed = parseAnalyzeApiKeyHeader('  sk-test-123  ')

    expect(parsed).toEqual({
      ok: true,
      data: 'sk-test-123',
    })
  })

  it('rejects a missing request-scoped api key', () => {
    const parsed = parseAnalyzeApiKeyHeader(undefined)

    expect(parsed.ok).toBe(false)
    expect(parsed).toEqual({
      ok: false,
      message: `Missing ${analyzeApiKeyHeader} header.`,
    })
  })
})

describe('validateModelAnalysis', () => {
  it('accepts semantically valid model output', () => {
    const parsed = parseAnalyzeRequest(validRequest)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    const result = validateModelAnalysis(parsed.data, {
      owner_summary: 'Sizing clarity and spill-positioning look like the two strongest preventable return themes.',
      ranked_leaks: [
        {
          candidate_id: 'cand_a',
          rank: 1,
          headline: 'Sizing ambiguity is the likely return driver.',
          cause_hypothesis:
            'Review and support evidence both point to unclear fit guidance around toe-box width and sizing direction.',
          confidence: 'high',
          evidence_refs: ['ev_a_1', 'ev_a_2'],
          recommended_fixes: [
            {
              type: 'size_guide',
              title: 'Add fit guidance near the buy box',
              rationale: 'Customers are already asking whether to size up, so the size choice needs explicit guidance.',
              before: 'Lightweight running shoe.',
              after: 'Lightweight running shoe with a snug toe box; if you are between sizes or prefer extra room, size up.',
            },
          ],
          what_not_to_claim: 'Do not claim the shoe fits every foot shape or eliminates returns.',
        },
        {
          candidate_id: 'cand_b',
          rank: 2,
          headline: 'Spill-proof language likely overstates the lid behavior.',
          cause_hypothesis:
            'The review cites leaking when tipped in a bag, while the current copy makes a broad commuting-safe implication.',
          confidence: 'medium',
          evidence_refs: ['ev_b_1', 'ev_b_2'],
          recommended_fixes: [
            {
              type: 'shipping_notice',
              title: 'Clarify upright-use expectations',
              rationale: 'The current positioning needs a narrower claim that matches the reported behavior.',
              before: 'Insulated mug for daily commutes.',
              after: 'Insulated mug designed for upright carrying; avoid storing it tipped in a packed bag.',
            },
          ],
          what_not_to_claim: 'Do not claim the mug is leakproof in every bag position.',
        },
      ],
    })

    expect(result.ok).toBe(true)
  })

  it('rejects evidence refs from the wrong candidate', () => {
    const parsed = parseAnalyzeRequest(validRequest)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    const result = validateModelAnalysis(parsed.data, {
      owner_summary: 'The model crossed evidence.',
      ranked_leaks: [
        {
          candidate_id: 'cand_a',
          rank: 1,
          headline: 'Sizing ambiguity is the likely return driver.',
          cause_hypothesis: 'The evidence is mixed.',
          confidence: 'high',
          evidence_refs: ['ev_b_1'],
          recommended_fixes: [
            {
              type: 'product_copy',
              title: 'Clarify fit',
              rationale: 'Customers need clearer fit guidance.',
              before: 'Lightweight running shoe.',
              after: 'Snug fit; size up if you prefer extra toe room.',
            },
          ],
          what_not_to_claim: 'Do not promise universal fit.',
        },
        {
          candidate_id: 'cand_b',
          rank: 2,
          headline: 'Spill-proof language likely overstates the lid behavior.',
          cause_hypothesis: 'The evidence is mixed.',
          confidence: 'medium',
          evidence_refs: ['ev_b_1'],
          recommended_fixes: [
            {
              type: 'product_copy',
              title: 'Clarify commuting usage',
              rationale: 'Customers need a narrower claim.',
              before: 'Insulated mug for daily commutes.',
              after: 'Designed for upright commuting use.',
            },
          ],
          what_not_to_claim: 'Do not promise leakproof use in every position.',
        },
      ],
    })

    expect(result.ok).toBe(false)
  })

  it('rejects monetary language in model output', () => {
    const parsed = parseAnalyzeRequest(validRequest)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    const result = validateModelAnalysis(parsed.data, {
      owner_summary: 'This could save $1000 if fixed.',
      ranked_leaks: [
        {
          candidate_id: 'cand_a',
          rank: 1,
          headline: 'Sizing ambiguity is the likely return driver.',
          cause_hypothesis: 'The evidence is mixed.',
          confidence: 'high',
          evidence_refs: ['ev_a_1'],
          recommended_fixes: [
            {
              type: 'product_copy',
              title: 'Clarify fit',
              rationale: 'Customers need clearer fit guidance.',
              before: 'Lightweight running shoe.',
              after: 'Snug fit; size up if you prefer extra toe room.',
            },
          ],
          what_not_to_claim: 'Do not promise universal fit.',
        },
        {
          candidate_id: 'cand_b',
          rank: 2,
          headline: 'Spill-proof language likely overstates the lid behavior.',
          cause_hypothesis: 'The evidence is mixed.',
          confidence: 'medium',
          evidence_refs: ['ev_b_1'],
          recommended_fixes: [
            {
              type: 'product_copy',
              title: 'Clarify commuting usage',
              rationale: 'Customers need a narrower claim.',
              before: 'Insulated mug for daily commutes.',
              after: 'Designed for upright commuting use.',
            },
          ],
          what_not_to_claim: 'Do not promise leakproof use in every position.',
        },
      ],
    })

    expect(result.ok).toBe(false)
  })
})
