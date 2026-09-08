import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateWithGemini, getGeminiProviderStatus } from './geminiProvider.js'
import {
  generateReplicateAdvisoryImage,
  generateReplicateCopy,
  generateReplicateHybridArtwork,
  generateReplicateLayoutBlueprint,
  getReplicateStatus
} from './replicateProvider.js'
import { selectReference, selectReferences } from './referenceSelector.js'
import { buildReferenceAdvisoryPrompt } from './visualPromptBuilder.js'
import { buildHybridArtworkPrompt } from './hybridArtworkPrompt.js'
import { clearRuntimeGeminiConfig, saveRuntimeGeminiConfig } from './secretStore.js'
import {
  createAdminSession,
  destroyAdminSession,
  isAdminAuthenticated,
  isAdminConfigured,
  makeClearSessionCookie,
  makeSessionCookie,
  requireAdmin
} from './adminAuth.js'

const PORT = Number(process.env.PORT || process.env.ADVISORY_API_PORT || 8787)
const MAX_BODY_BYTES = 64 * 1024
const DIST_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

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

const ALLOWED_SIMILARITY = new Set(['low', 'medium', 'high'])
const ALLOWED_CONCEPTS = new Set(['balanced', 'illustration', 'infographic', 'scenario'])

function writeJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...headers
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

function validateReferenceImageRequest(payload) {
  const base = validateRequest(payload)
  const similarity = ALLOWED_SIMILARITY.has(payload?.similarity) ? payload.similarity : 'medium'
  const concept = ALLOWED_CONCEPTS.has(payload?.concept) ? payload.concept : 'balanced'
  const referenceId = typeof payload?.referenceId === 'string' ? payload.referenceId : 'auto'
  const seed = Number.isInteger(payload?.seed) ? payload.seed : undefined
  return { ...base, similarity, concept, referenceId, seed }
}

function assertAdminMutation(request) {
  requireAdmin(request)
  if (request.headers['x-admin-request'] !== '1') {
    const error = new Error('Invalid admin request.')
    error.statusCode = 403
    throw error
  }
}

function writeApiError(response, error, fallbackMessage = 'Request failed.') {
  const rawMessage = error?.message || fallbackMessage
  const configurationError = /credentials|GOOGLE_CLOUD_PROJECT|GEMINI_API_KEY|REPLICATE_API_TOKEN|ADMIN_PASSWORD|encryption|Replicate is not configured/i.test(rawMessage)
  const clientError = /required|supported|characters|valid JSON|too large|valid Gemini API key|invalid admin request|reference image/i.test(rawMessage)
  const status = error?.statusCode || (clientError ? 400 : (configurationError ? 503 : 500))

  let message = rawMessage
  if (/API_KEY_SERVICE_BLOCKED|PERMISSION_DENIED/i.test(rawMessage)) {
    message = 'Gemini is configured but the API key does not have permission to use the Gemini API.'
  }
  if (/Unauthorized|authentication|Invalid token|401/i.test(rawMessage) && /replicate/i.test(rawMessage)) {
    message = 'The Replicate API token is invalid or no longer authorised.'
  }

  console.error('[advisory-api]', rawMessage)
  writeJson(response, status, { error: message })
}

async function handleGenerate(request, response) {
  try {
    const payload = await readJson(request)
    const input = validateRequest(payload)
    const result = await generateWithGemini(input)
    writeJson(response, 200, result)
  } catch (error) {
    writeApiError(response, error, 'Unable to generate advisory content.')
  }
}

async function handleGenerateReferenceImage(request, response) {
  try {
    const payload = await readJson(request)
    const input = validateReferenceImageRequest(payload)
    const references = selectReferences({ ...input, limit: 3 })
    const reference = references[0] || selectReference(input)
    const advisory = await generateReplicateCopy(input)
    const prompt = buildReferenceAdvisoryPrompt({
      advisory,
      reference,
      references,
      similarity: input.similarity,
      concept: input.concept
    })
    const imageUrl = await generateReplicateAdvisoryImage({
      prompt,
      referenceUrls: references.map(item => item.url),
      seed: input.seed
    })
    const replicate = getReplicateStatus()

    writeJson(response, 200, {
      advisory: {
        ...advisory,
        topic: input.topic,
        audience: input.audience,
        advisoryType: input.advisoryType
      },
      imageUrl,
      reference: {
        id: reference.id,
        title: reference.title,
        url: reference.url,
        category: reference.category,
        visualFamily: reference.visualFamily
      },
      provider: 'replicate',
      textModel: replicate.textModel,
      imageModel: replicate.imageModel,
      similarity: input.similarity,
      concept: input.concept,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    writeApiError(response, error, 'Unable to generate reference-guided advisory image.')
  }
}

async function handleGenerateHybrid(request, response) {
  try {
    const payload = await readJson(request)
    const input = validateReferenceImageRequest(payload)
    const references = selectReferences({ ...input, limit: 3 })
    if (!references.length) throw new Error('No approved advisory reference image is available.')

    const advisory = await generateReplicateCopy(input)
    const blueprint = await generateReplicateLayoutBlueprint({
      advisory,
      references,
      similarity: input.similarity,
      concept: input.concept
    })
    const artworkPrompt = buildHybridArtworkPrompt({
      advisory,
      blueprint,
      references,
      similarity: input.similarity,
      concept: input.concept
    })
    const artworkUrl = await generateReplicateHybridArtwork({
      prompt: artworkPrompt,
      referenceUrls: references.map(item => item.url),
      seed: input.seed
    })
    const replicate = getReplicateStatus()

    writeJson(response, 200, {
      project: {
        version: 1,
        mode: 'hybrid-editable',
        topic: input.topic,
        audience: input.audience,
        advisoryType: input.advisoryType,
        advisory,
        blueprint,
        artworkUrl,
        brand: {
          name: 'Innvikta',
          logoText: 'INNVIKTA',
          footerText: 'Stay aware. Stay secure.'
        },
        references: references.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          category: item.category,
          visualFamily: item.visualFamily
        })),
        generation: {
          provider: 'replicate',
          textModel: replicate.textModel,
          imageModel: replicate.imageModel,
          similarity: input.similarity,
          concept: input.concept,
          generatedAt: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    writeApiError(response, error, 'Unable to generate hybrid editable advisory.')
  }
}

async function handleAdminLogin(request, response) {
  try {
    const payload = await readJson(request)
    const password = typeof payload?.password === 'string' ? payload.password : ''
    const token = createAdminSession(request, password)
    const provider = await getGeminiProviderStatus()
    writeJson(response, 200, { authenticated: true, provider }, { 'Set-Cookie': makeSessionCookie(token) })
  } catch (error) {
    writeApiError(response, error, 'Unable to sign in.')
  }
}

async function handleAdminSettings(request, response) {
  try {
    requireAdmin(request)
    const provider = await getGeminiProviderStatus()
    const replicate = getReplicateStatus()
    writeJson(response, 200, {
      authenticated: true,
      adminConfigured: isAdminConfigured(),
      replicate,
      gemini: {
        configured: provider.configured,
        source: provider.source,
        provider: provider.provider,
        model: provider.model,
        imageModel: provider.imageModel,
        maskedKey: provider.last4 ? `••••••••${provider.last4}` : null,
        updatedAt: provider.updatedAt
      }
    })
  } catch (error) {
    writeApiError(response, error, 'Unable to load admin settings.')
  }
}

async function handleSaveGeminiSettings(request, response) {
  try {
    assertAdminMutation(request)
    const payload = await readJson(request)
    await saveRuntimeGeminiConfig({
      apiKey: payload?.apiKey,
      model: payload?.model,
      imageModel: payload?.imageModel
    })
    const provider = await getGeminiProviderStatus()
    writeJson(response, 200, {
      saved: true,
      gemini: {
        configured: true,
        source: provider.source,
        provider: provider.provider,
        model: provider.model,
        imageModel: provider.imageModel,
        maskedKey: provider.last4 ? `••••••••${provider.last4}` : null,
        updatedAt: provider.updatedAt
      }
    })
  } catch (error) {
    writeApiError(response, error, 'Unable to save Gemini settings.')
  }
}

async function handleDeleteGeminiSettings(request, response) {
  try {
    assertAdminMutation(request)
    await clearRuntimeGeminiConfig()
    const provider = await getGeminiProviderStatus()
    writeJson(response, 200, {
      removed: true,
      gemini: {
        configured: provider.configured,
        source: provider.source,
        provider: provider.provider,
        model: provider.model,
        imageModel: provider.imageModel,
        maskedKey: provider.last4 ? `••••••••${provider.last4}` : null,
        updatedAt: provider.updatedAt
      }
    })
  } catch (error) {
    writeApiError(response, error, 'Unable to remove Gemini settings.')
  }
}

async function streamFile(request, response, filePath) {
  const info = await stat(filePath)
  if (!info.isFile()) return false

  const extension = path.extname(filePath).toLowerCase()
  const cacheControl = filePath.includes(`${path.sep}assets${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'

  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  })

  if (request.method === 'HEAD') {
    response.end()
    return true
  }

  createReadStream(filePath).pipe(response)
  return true
}

async function serveFrontend(request, response, url) {
  if (!['GET', 'HEAD'].includes(request.method)) return false

  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return false
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const requestedPath = path.resolve(DIST_DIR, relativePath)
  const insideDist = requestedPath === DIST_DIR || requestedPath.startsWith(`${DIST_DIR}${path.sep}`)

  if (!insideDist) return false

  try {
    if (await streamFile(request, response, requestedPath)) return true
  } catch {
    // Fall through to the SPA entry point.
  }

  try {
    return await streamFile(request, response, path.join(DIST_DIR, 'index.html'))
  } catch {
    return false
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    try {
      const provider = await getGeminiProviderStatus()
      const replicate = getReplicateStatus()
      writeJson(response, 200, {
        ok: true,
        service: 'advisory-generator',
        primaryMode: 'hybrid-editable',
        primaryProvider: replicate.configured ? 'replicate' : provider.provider,
        replicate,
        gemini: {
          provider: provider.provider,
          configured: provider.configured,
          source: provider.source
        },
        adminConfigured: isAdminConfigured()
      })
    } catch (error) {
      writeApiError(response, error, 'Unable to read service health.')
    }
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/session') {
    writeJson(response, 200, {
      authenticated: isAdminAuthenticated(request),
      adminConfigured: isAdminConfigured()
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/login') {
    await handleAdminLogin(request, response)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
    destroyAdminSession(request)
    writeJson(response, 200, { authenticated: false }, { 'Set-Cookie': makeClearSessionCookie() })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/settings') {
    await handleAdminSettings(request, response)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/settings/gemini') {
    await handleSaveGeminiSettings(request, response)
    return
  }

  if (request.method === 'DELETE' && url.pathname === '/api/admin/settings/gemini') {
    await handleDeleteGeminiSettings(request, response)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/advisories/generate-hybrid') {
    await handleGenerateHybrid(request, response)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/advisories/generate-reference-image') {
    await handleGenerateReferenceImage(request, response)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/advisories/generate') {
    await handleGenerate(request, response)
    return
  }

  if (url.pathname.startsWith('/api/')) {
    writeJson(response, 404, { error: 'Not found.' })
    return
  }

  if (await serveFrontend(request, response, url)) return

  writeJson(response, 404, { error: 'Frontend build is not available. Run npm run build first.' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Advisory Generator listening on http://0.0.0.0:${PORT}`)
})
