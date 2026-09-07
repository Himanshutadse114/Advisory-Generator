import http from 'node:http'
import { generateWithGemini } from './geminiProvider.js'

const PORT = Number(process.env.ADVISORY_API_PORT || 8787)
const MAX_BODY_BYTES = 64 * 1024

const ALLOWED_AUDIENCES = new Set([
  'All Employees',
  'Senior Executives',
  'Finance Teams',
  'IT & Security Teams',
  'Customers'
])

const ALLOWED_TYPES = new Set([
  'Internal Advisory',
  'External Advisory',
  'Executive Advisory'
])

function writeJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  })
  response.end(JSON.stringify(payload))
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0

    request.on('data', chunk => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'))
        request.destroy()
        return
      }
      body += chunk
    })

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })

    request.on('error', reject)
  })
}

function validateRequest(payload) {
  const topic = typeof payload?.topic === 'string' ? payload.topic.trim().replace(/\s+/g, ' ') : ''
  const audience = payload?.audience
  const advisoryType = payload?.advisoryType

  if (!topic) throw new Error('Advisory topic is required.')
  if (topic.length > 160) throw new Error('Advisory topic must be 160 characters or fewer.')
  if (!ALLOWED_AUDIENCES.has(audience)) throw new Error('Unsupported advisory audience.')
  if (!ALLOWED_TYPES.has(advisoryType)) throw new Error('Unsupported advisory type.')

  return { topic, audience, advisoryType }
}

async function handleGenerate(request, response) {
  try {
    const payload = await readJson(request)
    const input = validateRequest(payload)
    const result = await generateWithGemini(input)
    writeJson(response, 200, result)
  } catch (error) {
    const message = error?.message || 'Unable to generate advisory content.'
    const configurationError = /credentials|GOOGLE_CLOUD_PROJECT|GEMINI_API_KEY/i.test(message)
    const clientError = /required|supported|characters|valid JSON|too large/i.test(message)
    const status = clientError ? 400 : (configurationError ? 503 : 500)

    console.error('[advisory-api]', message)
    writeJson(response, status, { error: message })
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    writeJson(response, 200, {
      ok: true,
      service: 'advisory-content-api',
      provider: process.env.GOOGLE_CLOUD_PROJECT ? 'google-vertex-ai' : (process.env.GEMINI_API_KEY ? 'google-gemini' : 'not-configured')
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/advisories/generate') {
    await handleGenerate(request, response)
    return
  }

  writeJson(response, 404, { error: 'Not found.' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Advisory content API listening on http://0.0.0.0:${PORT}`)
})
