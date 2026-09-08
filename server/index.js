import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateWithGemini, getGeminiProviderStatus } from './geminiProvider.js'
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

function assertAdminMutation(request) {
  requireAdmin(request)
  if (request.headers['x-admin-request'] !== '1') {
    const error = new Error('Invalid admin request.')
    error.statusCode = 403
    throw error
  }
}

function writeApiError(response, error, fallbackMessage = 'Request failed.') {
  const message = error?.message || fallbackMessage
  const configurationError = /credentials|GOOGLE_CLOUD_PROJECT|GEMINI_API_KEY|ADMIN_PASSWORD|encryption/i.test(message)
  const clientError = /required|supported|characters|valid JSON|too large|valid Gemini API key|invalid admin request/i.test(message)
  const status = error?.statusCode || (clientError ? 400 : (configurationError ? 503 : 500))
  console.error('[advisory-api]', message)
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
    writeJson(response, 200, {
      authenticated: true,
      adminConfigured: isAdminConfigured(),
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
      writeJson(response, 200, {
        ok: true,
        service: 'advisory-generator',
        provider: provider.provider,
        configured: provider.configured,
        source: provider.source,
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
