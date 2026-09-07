import { GoogleGenAI } from '@google/genai'
import { ADVISORY_RESPONSE_SCHEMA, buildAdvisoryPrompt } from './advisoryPrompt.js'

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const DEFAULT_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global'

function createClient() {
  const project = process.env.GOOGLE_CLOUD_PROJECT
  const apiKey = process.env.GEMINI_API_KEY

  if (project) {
    return {
      client: new GoogleGenAI({
        vertexai: true,
        project,
        location: DEFAULT_LOCATION
      }),
      authMode: 'vertex-ai'
    }
  }

  if (apiKey) {
    return {
      client: new GoogleGenAI({ apiKey }),
      authMode: 'gemini-api-key'
    }
  }

  throw new Error(
    'AI credentials are not configured. Set GOOGLE_CLOUD_PROJECT with Application Default Credentials or set GEMINI_API_KEY.'
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
  const { client, authMode } = createClient()
  const prompt = buildAdvisoryPrompt(request)

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
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
    provider: authMode === 'vertex-ai' ? 'google-vertex-ai' : 'google-gemini',
    model: DEFAULT_MODEL
  }
}
