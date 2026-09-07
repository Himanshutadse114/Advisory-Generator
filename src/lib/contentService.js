import { generateAdvisory } from './advisoryEngine'

const DEFAULT_ENDPOINT = '/api/advisories/generate'

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasFourStrings(value) {
  return Array.isArray(value) && value.length === 4 && value.every(isString)
}

export function validateGeneratedAdvisory(payload) {
  if (!payload || typeof payload !== 'object') return false

  return [
    payload.title,
    payload.intro,
    payload.category,
    payload.sectionOneTitle,
    payload.sectionTwoTitle
  ].every(isString) && hasFourStrings(payload.sectionOnePoints) && hasFourStrings(payload.sectionTwoPoints)
}

function normaliseAiResponse(payload, request) {
  const source = payload?.advisory || payload
  if (!validateGeneratedAdvisory(source)) {
    throw new Error('AI service returned an invalid advisory structure.')
  }

  return {
    id: `adv-${Date.now()}`,
    topic: request.topic.trim().replace(/\s+/g, ' '),
    title: source.title.trim(),
    eyebrow: request.advisoryType.toUpperCase(),
    audience: request.audience,
    advisoryType: request.advisoryType,
    category: source.category.trim(),
    intro: source.intro.trim(),
    sectionOneTitle: source.sectionOneTitle.trim(),
    sectionOnePoints: source.sectionOnePoints.map(point => point.trim()),
    sectionTwoTitle: source.sectionTwoTitle.trim(),
    sectionTwoPoints: source.sectionTwoPoints.map(point => point.trim()),
    generatedAt: new Date().toISOString(),
    generation: {
      mode: 'ai',
      provider: payload?.provider || 'configured-ai',
      model: payload?.model || null
    }
  }
}

export async function generateAdvisoryContent(request, options = {}) {
  const endpoint = options.endpoint || import.meta.env.VITE_ADVISORY_AI_ENDPOINT || DEFAULT_ENDPOINT
  const controller = new AbortController()
  const timeoutMs = Number(options.timeoutMs || 30000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    })

    if (!response.ok) {
      let message = `AI service request failed (${response.status}).`
      try {
        const errorBody = await response.json()
        if (errorBody?.error) message = errorBody.error
      } catch {
        // Keep the HTTP status message when the body is not JSON.
      }
      throw new Error(message)
    }

    const payload = await response.json()
    return {
      advisory: normaliseAiResponse(payload, request),
      fallback: false,
      error: null
    }
  } catch (error) {
    if (options.allowFallback === false) throw error

    const advisory = generateAdvisory(request)
    advisory.generation = {
      mode: 'local-fallback',
      provider: 'local-rules',
      model: null
    }

    return {
      advisory,
      fallback: true,
      error: error?.name === 'AbortError'
        ? 'AI generation timed out. Local controlled copy was used instead.'
        : (error?.message || 'AI generation was unavailable. Local controlled copy was used instead.')
    }
  } finally {
    clearTimeout(timeout)
  }
}
