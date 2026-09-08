const DEFAULT_ENDPOINT = '/api/advisories/generate-reference-image'

export async function generateReferenceAdvisoryImage(request, options = {}) {
  const endpoint = options.endpoint || DEFAULT_ENDPOINT
  const controller = new AbortController()
  const timeoutMs = Number(options.timeoutMs || 150000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal
    })

    let payload = null
    try { payload = await response.json() } catch { /* keep status error */ }

    if (!response.ok) {
      throw new Error(payload?.error || `AI image generation failed (${response.status}).`)
    }
    if (!payload?.imageUrl || !payload?.advisory || !payload?.reference) {
      throw new Error('AI image service returned an incomplete result.')
    }

    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('AI advisory generation timed out. Please try again.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
