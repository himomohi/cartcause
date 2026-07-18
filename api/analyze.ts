import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

import {
  AnalyzeSuccessSchema,
  analyzeApiKeyHeader,
  buildAnalyzeInput,
  buildAnalyzeInstructions,
  createSafetyIdentifier,
  getMaxRequestBytes,
  parseAnalyzeApiKeyHeader,
  parseAnalyzeRequest,
  validateModelAnalysis,
  analyzeResponseFormat,
} from '../src/lib/cartcause-analyze.js'

type ApiErrorBody = {
  error: {
    code: string
    message: string
    retryable: boolean
  }
}

const MAX_REQUEST_BYTES = getMaxRequestBytes()

function setNoStoreHeaders(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
}

function sendJson(res: VercelResponse, status: number, payload: ApiErrorBody | unknown): void {
  setNoStoreHeaders(res)
  res.status(status).json(payload)
}

function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): void {
  sendJson(res, status, {
    error: {
      code,
      message,
      retryable,
    },
  })
}

function getContentType(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

async function readJsonBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body) > MAX_REQUEST_BYTES) {
        throw new Error('REQUEST_TOO_LARGE')
      }

      return JSON.parse(req.body)
    }

    if (Buffer.isBuffer(req.body)) {
      if (req.body.byteLength > MAX_REQUEST_BYTES) {
        throw new Error('REQUEST_TOO_LARGE')
      }

      return JSON.parse(req.body.toString('utf8'))
    }

    return req.body
  }

  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.byteLength

    if (totalBytes > MAX_REQUEST_BYTES) {
      throw new Error('REQUEST_TOO_LARGE')
    }

    chunks.push(buffer)
  }

  if (totalBytes === 0) {
    throw new SyntaxError('Empty body')
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
  })
}

function isRefusalResponse(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    sendError(res, 405, 'method_not_allowed', 'Use POST for this endpoint.', false)
    return
  }

  const contentType = getContentType(req.headers['content-type'])
  if (!contentType.toLowerCase().includes('application/json')) {
    sendError(res, 400, 'invalid_request', 'Content-Type must be application/json.', false)
    return
  }

  const requestApiKey = parseAnalyzeApiKeyHeader(req.headers[analyzeApiKeyHeader])
  if (!requestApiKey.ok) {
    sendError(res, 400, 'missing_api_key', requestApiKey.message, false)
    return
  }

  let parsedRequest

  try {
    const body = await readJsonBody(req)
    parsedRequest = parseAnalyzeRequest(body)
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
      sendError(res, 400, 'invalid_request', 'Request body is too large.', false)
      return
    }

    sendError(res, 400, 'invalid_json', 'Request body must be valid JSON.', false)
    return
  }

  if (!parsedRequest.ok) {
    sendError(res, 400, 'invalid_request', parsedRequest.message, false)
    return
  }

  try {
    const request = parsedRequest.data
    const client = getOpenAIClient(requestApiKey.data)
    const response = await client.responses.parse({
      model: 'gpt-5.6',
      store: false,
      reasoning: { effort: 'medium' },
      safety_identifier: createSafetyIdentifier(request.clientSessionId),
      instructions: buildAnalyzeInstructions(request.candidates.length),
      input: buildAnalyzeInput(request),
      text: {
        format: zodTextFormat(analyzeResponseFormat, 'cartcause_analysis'),
      },
    })

    if (!response.output_parsed) {
      sendError(res, 502, 'provider_refusal', 'Live analysis was unavailable.', false)
      return
    }

    const validated = validateModelAnalysis(request, response.output_parsed)
    if (!validated.ok) {
      sendError(res, 502, 'provider_invalid_response', 'Live analysis returned an invalid result.', true)
      return
    }

    const payload = {
      analysis: validated.data,
      meta: {
        model: 'gpt-5.6' as const,
        live: true as const,
      },
    }

    const success = AnalyzeSuccessSchema.parse(payload)
    sendJson(res, 200, success)
  } catch (error) {
    if (error instanceof OpenAI.RateLimitError) {
      sendError(res, 429, 'upstream_rate_limited', 'Live analysis is temporarily rate limited.', true)
      return
    }

    if (error instanceof OpenAI.APIError) {
      sendError(res, 502, 'provider_failure', 'Live analysis was unavailable.', true)
      return
    }

    if (isRefusalResponse(error)) {
      sendError(res, 502, 'provider_invalid_response', 'Live analysis returned an invalid result.', true)
      return
    }

    sendError(res, 500, 'unexpected_error', 'Unexpected server error.', true)
  }
}
