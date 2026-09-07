import { randomBytes, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'advisory_admin_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const sessions = new Map()
const attempts = new Map()

function cleanExpired() {
  const now = Date.now()
  for (const [token, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(token)
  for (const [ip, state] of attempts) if (state.resetAt <= now) attempts.delete(ip)
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD || ''
  if (password.length < 12) {
    throw new Error('Admin access is not configured. Set ADMIN_PASSWORD to at least 12 characters.')
  }
  return password
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  return request.socket?.remoteAddress || 'unknown'
}

function recordFailure(ip) {
  const now = Date.now()
  const current = attempts.get(ip)
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
    return
  }
  current.count += 1
}

function assertNotRateLimited(ip) {
  const state = attempts.get(ip)
  if (state && state.resetAt > Date.now() && state.count >= MAX_ATTEMPTS) {
    const error = new Error('Too many admin login attempts. Try again later.')
    error.statusCode = 429
    throw error
  }
}

function parseCookies(request) {
  const header = request.headers.cookie || ''
  return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=')
    return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
  }))
}

export function createAdminSession(request, password) {
  cleanExpired()
  const ip = getClientIp(request)
  assertNotRateLimited(ip)

  if (!safeEqual(password, getAdminPassword())) {
    recordFailure(ip)
    const error = new Error('Invalid admin password.')
    error.statusCode = 401
    throw error
  }

  attempts.delete(ip)
  const token = randomBytes(32).toString('base64url')
  sessions.set(token, Date.now() + SESSION_TTL_MS)
  return token
}

export function isAdminAuthenticated(request) {
  cleanExpired()
  const token = parseCookies(request)[COOKIE_NAME]
  if (!token) return false
  const expiresAt = sessions.get(token)
  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token)
    return false
  }
  return true
}

export function requireAdmin(request) {
  if (!isAdminAuthenticated(request)) {
    const error = new Error('Admin authentication required.')
    error.statusCode = 401
    throw error
  }
}

export function destroyAdminSession(request) {
  const token = parseCookies(request)[COOKIE_NAME]
  if (token) sessions.delete(token)
}

export function makeSessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
}

export function makeClearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12)
}
