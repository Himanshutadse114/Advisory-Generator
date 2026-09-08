import { buildAdvisoryPrompt } from './advisoryPrompt.js'

const DEFAULT_TEXT_MODEL = process.env.REPLICATE_TEXT_MODEL || 'meta/meta-llama-3-8b-instruct'
const DEFAULT_IMAGE_MODEL = process.env.REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-kontext-pro'
const API_ROOT = 'https://api.replicate.com/v1'
const POLL_INTERVAL_MS = 1200
const MAX_WAIT_MS = 120000

function getToken() {
  const token = process.env.REPLICATE_API_TOKEN?.trim()
  if (!token) throw new Error('Replicate is not configured. Add REPLICATE_API_TOKEN in Render Environment Variables.')
  return token
}

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    ...extra
  }
}

function normaliseModel(model) {
  const parts = String(model || '').split('/').filter(Boolean)
  if (parts.length !== 2) throw new Error(`Invalid Replicate model identifier: ${model}`)
  return parts
}

async function parseApiError(response) {
  try {
    const body = await response.json()
    return body?.detail || body?.error || body?.title || `Replicate request failed (${response.status}).`
  } catch {
    return `Replicate request failed (${response.status}).`
  }
}

async function getPrediction(url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!response.ok) throw new Error(await parseApiError(response))
  return response.json()
}

async function runPrediction(model, input) {
  const [owner, name] = normaliseModel(model)
  const response = await fetch(`${API_ROOT}/models/${owner}/${name}/predictions`, {
    method: 'POST',
    headers: headers({ Prefer: 'wait=60' }),
    body: JSON.stringify({ input })
  })

  if (!response.ok) throw new Error(await parseApiError(response))
  let prediction = await response.json()

  if (prediction.status === 'succeeded') return prediction.output
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(prediction.error || `Replicate ${prediction.status} the prediction.`)
  }

  const pollUrl = prediction?.urls?.get
  if (!pollUrl) throw new Error('Replicate did not return a prediction status URL.')

  const started = Date.now()
  while (Date.now() - started < MAX_WAIT_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    prediction = await getPrediction(pollUrl)
    if (prediction.status === 'succeeded') return prediction.output
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Replicate ${prediction.status} the prediction.`)
    }
  }

  throw new Error('Replicate generation timed out. Please try again.')
}

function extractJson(text) {
  const source = String(text || '').trim()
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || source
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Replicate text model did not return JSON.')

  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw new Error('Replicate text model returned invalid advisory JSON.')
  }
}

function validateAdvisory(advisory) {
  const requiredStrings = ['title', 'intro', 'category', 'sectionOneTitle', 'sectionTwoTitle']
  if (!advisory || requiredStrings.some(key => typeof advisory[key] !== 'string' || !advisory[key].trim())) {
    throw new Error('Replicate returned incomplete advisory copy.')
  }
  for (const key of ['sectionOnePoints', 'sectionTwoPoints']) {
    if (!Array.isArray(advisory[key]) || advisory[key].length !== 4 || advisory[key].some(item => typeof item !== 'string' || !item.trim())) {
      throw new Error('Replicate advisory copy must contain exactly four points in each section.')
    }
  }
  return advisory
}

export async function generateReplicateCopy(request) {
  const prompt = `${buildAdvisoryPrompt(request)}\n\nReturn ONLY valid JSON using exactly this shape:\n{\n  "title": "...",\n  "intro": "...",\n  "category": "...",\n  "sectionOneTitle": "...",\n  "sectionOnePoints": ["...", "...", "...", "..."],\n  "sectionTwoTitle": "...",\n  "sectionTwoPoints": ["...", "...", "...", "..."]\n}`

  const output = await runPrediction(DEFAULT_TEXT_MODEL, {
    prompt,
    system_prompt: 'You are a cybersecurity awareness copywriter. Follow the requested JSON schema exactly. Never add markdown around the JSON.',
    max_new_tokens: 1100,
    max_tokens: 1100,
    temperature: 0.35,
    top_p: 0.9
  })

  const text = Array.isArray(output) ? output.join('') : String(output || '')
  return validateAdvisory(extractJson(text))
}

export async function generateReplicateAdvisoryImage({ prompt, referenceUrl, seed }) {
  if (!referenceUrl || !/^https:\/\//i.test(referenceUrl)) throw new Error('A valid advisory reference image is required.')

  const input = {
    prompt,
    input_image: referenceUrl,
    aspect_ratio: 'match_input_image',
    output_format: 'png',
    safety_tolerance: 2,
    prompt_upsampling: false
  }
  if (Number.isInteger(seed)) input.seed = seed

  const output = await runPrediction(DEFAULT_IMAGE_MODEL, input)
  const imageUrl = typeof output === 'string'
    ? output
    : (typeof output?.url === 'function' ? output.url() : output?.url)

  if (!imageUrl) throw new Error('Replicate image model returned no image URL.')
  return String(imageUrl)
}

export function getReplicateStatus() {
  return {
    configured: Boolean(process.env.REPLICATE_API_TOKEN?.trim()),
    provider: 'replicate',
    textModel: DEFAULT_TEXT_MODEL,
    imageModel: DEFAULT_IMAGE_MODEL
  }
}
