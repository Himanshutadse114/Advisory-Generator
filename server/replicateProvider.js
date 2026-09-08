import { buildAdvisoryPrompt } from './advisoryPrompt.js'
import { buildLayoutBlueprintPrompt, normaliseBlueprint } from './layoutBlueprint.js'

const DEFAULT_TEXT_MODEL = process.env.REPLICATE_TEXT_MODEL || 'meta/meta-llama-3-8b-instruct'
const DEFAULT_IMAGE_MODEL = process.env.REPLICATE_IMAGE_MODEL || 'openai/gpt-image-2'
const API_ROOT = 'https://api.replicate.com/v1'
const POLL_INTERVAL_MS = 1200
const MAX_WAIT_MS = 150000

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
    throw new Error('Replicate text model returned invalid JSON.')
  }
}

function outputText(output) {
  return Array.isArray(output) ? output.join('') : String(output || '')
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
  const prompt = `${buildAdvisoryPrompt(request)}\n\nEDITABLE ADVISORY COPY LIMITS:\n- Introduction: maximum 190 characters.\n- Each bullet: 50 to 92 characters where possible.\n- Section headings: maximum 28 characters.\n- Keep wording simple, concrete and easy to scan.\n\nReturn ONLY valid JSON using exactly this shape:\n{\n  "title": "...",\n  "intro": "...",\n  "category": "...",\n  "sectionOneTitle": "...",\n  "sectionOnePoints": ["...", "...", "...", "..."],\n  "sectionTwoTitle": "...",\n  "sectionTwoPoints": ["...", "...", "...", "..."]\n}`

  const output = await runPrediction(DEFAULT_TEXT_MODEL, {
    prompt,
    system_prompt: 'You are a cybersecurity awareness copywriter. Follow the requested JSON schema exactly. Never add markdown around the JSON.',
    max_new_tokens: 900,
    max_tokens: 900,
    temperature: 0.25,
    top_p: 0.9
  })

  return validateAdvisory(extractJson(outputText(output)))
}

export async function generateReplicateLayoutBlueprint({ advisory, references, similarity, concept }) {
  const prompt = buildLayoutBlueprintPrompt({ advisory, references, similarity, concept })
  try {
    const output = await runPrediction(DEFAULT_TEXT_MODEL, {
      prompt,
      system_prompt: 'You are an editorial layout planner. Return only valid JSON. Never add markdown or commentary.',
      max_new_tokens: 1100,
      max_tokens: 1100,
      temperature: 0.35,
      top_p: 0.9
    })
    return normaliseBlueprint(extractJson(outputText(output)), references[0])
  } catch (error) {
    console.warn('[hybrid-layout] using safe fallback:', error.message)
    return normaliseBlueprint({}, references[0])
  }
}

function asImageUrl(value) {
  if (typeof value === 'string') return value
  if (typeof value?.url === 'string') return value.url
  if (typeof value?.url === 'function') return value.url()
  return null
}

async function generateImage({ prompt, referenceUrls, seed, aspectRatio = '2:3', quality = 'high' }) {
  const urls = (Array.isArray(referenceUrls) ? referenceUrls : [])
    .filter(url => typeof url === 'string' && /^https:\/\//i.test(url))
    .slice(0, 4)

  const isGptImage2 = DEFAULT_IMAGE_MODEL === 'openai/gpt-image-2'
  const isGptImage15 = DEFAULT_IMAGE_MODEL === 'openai/gpt-image-1.5'
  const variationPrompt = Number.isInteger(seed)
    ? `${prompt}\n\nCreate a visually different concept variation. Variation token: ${seed}.`
    : prompt

  let input
  if (isGptImage2) {
    input = {
      prompt: variationPrompt,
      quality,
      background: 'opaque',
      moderation: 'auto',
      aspect_ratio: aspectRatio,
      input_images: urls,
      output_format: 'png',
      number_of_images: 1,
      output_compression: 100
    }
  } else if (isGptImage15) {
    input = {
      prompt: variationPrompt,
      quality,
      background: 'opaque',
      moderation: 'auto',
      aspect_ratio: aspectRatio,
      input_images: urls,
      input_fidelity: 'high',
      output_format: 'png',
      number_of_images: 1,
      output_compression: 100
    }
  } else {
    if (urls.length === 0) throw new Error('A valid advisory reference image is required.')
    input = {
      prompt: variationPrompt,
      input_image: urls[0],
      aspect_ratio: 'match_input_image',
      output_format: 'png',
      safety_tolerance: 2,
      prompt_upsampling: false,
      ...(Number.isInteger(seed) ? { seed } : {})
    }
  }

  const output = await runPrediction(DEFAULT_IMAGE_MODEL, input)
  const first = Array.isArray(output) ? output[0] : output
  const imageUrl = asImageUrl(first)
  if (!imageUrl) throw new Error('Replicate image model returned no image URL.')
  return String(imageUrl)
}

export async function generateReplicateAdvisoryImage({ prompt, referenceUrl, referenceUrls, seed }) {
  const urls = (Array.isArray(referenceUrls) ? referenceUrls : [referenceUrl]).filter(Boolean)
  if (urls.length === 0) throw new Error('A valid advisory reference image is required.')
  return generateImage({ prompt, referenceUrls: urls, seed, aspectRatio: '2:3', quality: 'high' })
}

export async function generateReplicateHybridArtwork({ prompt, referenceUrls, seed }) {
  if (!Array.isArray(referenceUrls) || referenceUrls.length === 0) throw new Error('At least one approved reference image is required.')
  return generateImage({ prompt, referenceUrls, seed, aspectRatio: '2:3', quality: 'high' })
}

export function getReplicateStatus() {
  return {
    configured: Boolean(process.env.REPLICATE_API_TOKEN?.trim()),
    provider: 'replicate',
    textModel: DEFAULT_TEXT_MODEL,
    imageModel: DEFAULT_IMAGE_MODEL
  }
}
