import { beforeEach, describe, expect, it, vi } from 'vitest'

import { analyzeApiKeyHeader } from './cartcause-analyze'

const openAIConstructor = vi.fn()
const parseMock = vi.fn()

vi.mock('openai/helpers/zod', () => ({
  zodTextFormat: vi.fn(() => ({ mocked: true })),
}))

vi.mock('openai', () => {
  class MockOpenAI {
    static RateLimitError = class RateLimitError extends Error {}
    static APIError = class APIError extends Error {}
    responses = {
      parse: parseMock,
    }

    constructor(options: { apiKey: string }) {
      openAIConstructor(options)
    }
  }

  return {
    default: MockOpenAI,
  }
})

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
  ],
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
  }
}

describe('api/analyze BYOK handling', () => {
  beforeEach(() => {
    openAIConstructor.mockReset()
    parseMock.mockReset()
    vi.resetModules()
  })

  it('rejects requests without the dedicated api key header', async () => {
    const { default: handler } = await import('../../api/analyze')
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: validRequest,
    } as any
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      error: {
        code: 'missing_api_key',
        message: `Missing ${analyzeApiKeyHeader} header.`,
        retryable: false,
      },
    })
    expect(res.headers['Cache-Control']).toBe('no-store, max-age=0')
    expect(res.headers.Pragma).toBe('no-cache')
    expect(openAIConstructor).not.toHaveBeenCalled()
  })

  it('instantiates OpenAI with the request-scoped api key and never returns it', async () => {
    parseMock.mockResolvedValue({
      output_parsed: {
        owner_summary: 'Sizing clarity appears to be the strongest preventable return theme.',
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
        ],
      },
    })

    const { default: handler } = await import('../../api/analyze')
    const requestApiKey = 'test-byok-secret'
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [analyzeApiKeyHeader]: requestApiKey,
      },
      body: validRequest,
    } as any
    const res = createMockResponse()

    await handler(req, res as any)

    expect(openAIConstructor).toHaveBeenCalledWith({
      apiKey: requestApiKey,
    })
    expect(parseMock).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toBe('no-store, max-age=0')
    expect(res.headers.Pragma).toBe('no-cache')
    expect(JSON.stringify(res.body)).not.toContain(requestApiKey)
    expect(res.body).toEqual({
      analysis: {
        owner_summary: 'Sizing clarity appears to be the strongest preventable return theme.',
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
        ],
      },
      meta: {
        model: 'gpt-5.6',
        live: true,
      },
    })
  })
})
