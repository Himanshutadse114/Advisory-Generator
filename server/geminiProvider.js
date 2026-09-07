import { GoogleGenAI } from '@google/genai'
import { ADVISORY_RESPONSE_SCHEMA, buildAdvisoryPrompt } from './advisoryPrompt.js'
import { getRuntimeGeminiConfig } from './secretStore.js'

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const DEFAULT_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image'
const DEFAULT_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global'

async function createClient() {
  const runtime = await getRuntimeGeminiConfig()
  const project = process.env.GOOGLE_CLOUD_PROJECT
  const apiKey = runtime?.apiKey || process.env.GEMINI_API_KEY

  if (runtime?.apiKey) {
    return {
      client: new GoogleGenAI({ apiKey: runtime.apiKey }),
      authMode: 'admin-gemini-api-key',
      model: runtime.model || DEFAULT_MODEL,
      imageModel: runtime.imageModel || DEFAULT_IMAGE_MODEL
    }
  }

  if (project) {
    return {
      client: new GoogleGenAI({
        vertexai: true,
        project,
        location: DEFAULT_LOCATION
      }),
      authMode: 'vertex-ai',
      model: DEFAULT_MODEL,
      imageModel: DEFAULT_IMAGE_MODEL
    }
  }

  if (apiKey) {
    return {
      client: new GoogleGenAI({ apiKey }),
      authMode: 'gemini-api-key',
      model: DEFAULT_MODEL,
      imageModel: DEFAULT_IMAGE_MODEL
    }
  }

  throw new Error(
    'AI credentials are not configured. Add a Gemini API key in Admin Settings, set GOOGLE_CLOUD_PROJECT with Application Default Credentials or set GEMINI_API_KEY.'
  )
}

function parseResponseText(response) {
  const text = typeof response?.text === 'function' ? response.text() : response?.text
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned an empty response.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON.')
  }

  return parsed
}

export async function generateWithGemini(request) {
  const { client, authMode, model } = await createClient()
  const prompt = buildAdvisoryPrompt(request)

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.45,
      maxOutputTokens: 1400,
      responseMimeType: 'application/json',
      responseJsonSchema: ADVISORY_RESPONSE_SCHEMA
    }
  })

  return {
    advisory: parseResponseText(response),
    provider: authMode === 'vertex-ai' ? 'google-vertex-ai' : (authMode === 'admin-gemini-api-key' ? 'google-gemini-admin' : 'google-gemini'),
    model
  }
}

export async function getGeminiProviderStatus() {
  const runtime = await getRuntimeGeminiConfig()
  if (runtime?.apiKey) {
    return {
      configured: true,
      source: 'admin-panel',
      provider: 'google-gemini',
      model: runtime.model || DEFAULT_MODEL,
      imageModel: runtime.imageModel || DEFAULT_IMAGE_MODEL,
      last4: runtime.apiKey.slice(-4),
      updatedAt: runtime.updatedAt || null
    }
  }

  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return {
      configured: true,
      source: 'environment',
      provider: 'google-vertex-ai',
      model: DEFAULT_MODEL,
      imageModel: DEFAULT_IMAGE_MODEL,
      last4: null,
      updatedAt: null
    }
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      configured: true,
      source: 'environment',
      provider: 'google-gemini',
      model: DEFAULT_MODEL,
      imageModel: DEFAULT_IMAGE_MODEL,
      last4: process.env.GEMINI_API_KEY.slice(-4),
      updatedAt: null
    }
  }

  return {
    configured: false,
    source: 'none',
    provider: 'not-configured',
    model: DEFAULT_MODEL,
    imageModel: DEFAULT_IMAGE_MODEL,
    last4: null,
    updatedAt: null
  }
}
