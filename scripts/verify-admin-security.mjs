import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'advisory-admin-'))
process.env.ADMIN_PASSWORD = 'test-admin-password-2026'
process.env.ADMIN_ENCRYPTION_SECRET = 'test-encryption-secret-that-is-long-enough'
process.env.ADVISORY_DATA_DIR = tempDir

const secretStore = await import('../server/secretStore.js')
const adminAuth = await import('../server/adminAuth.js')

const testKey = 'AIzaSy_TEST_ONLY_1234567890abcdefghijklmnop'

await secretStore.saveRuntimeGeminiConfig({
  apiKey: testKey,
  model: 'gemini-2.5-flash',
  imageModel: 'gemini-3.1-flash-image'
})

const storedPath = secretStore.getRuntimeSecretPath()
const storedRaw = await fs.readFile(storedPath, 'utf8')
assert.equal(storedRaw.includes(testKey), false, 'Encrypted secret file must never contain the plaintext API key.')
assert.match(storedRaw, /aes-256-gcm/, 'Encrypted secret file should declare AES-256-GCM.')

const decrypted = await secretStore.getRuntimeGeminiConfig()
assert.equal(decrypted.apiKey, testKey, 'Encrypted Gemini key should decrypt correctly.')
assert.equal(decrypted.model, 'gemini-2.5-flash')
assert.equal(decrypted.imageModel, 'gemini-3.1-flash-image')

const status = await secretStore.getRuntimeGeminiStatus()
assert.equal(status.configured, true)
assert.equal(status.last4, testKey.slice(-4), 'Only the final four characters should be used for masked status.')

const loginRequest = { headers: {}, socket: { remoteAddress: '127.0.0.1' } }
const token = adminAuth.createAdminSession(loginRequest, process.env.ADMIN_PASSWORD)
assert.ok(token.length >= 32, 'Admin session token should be cryptographically random.')
const cookieRequest = { headers: { cookie: `advisory_admin_session=${encodeURIComponent(token)}` }, socket: { remoteAddress: '127.0.0.1' } }
assert.equal(adminAuth.isAdminAuthenticated(cookieRequest), true, 'Valid admin session should authenticate.')
adminAuth.destroyAdminSession(cookieRequest)
assert.equal(adminAuth.isAdminAuthenticated(cookieRequest), false, 'Destroyed admin session must not authenticate.')

await secretStore.clearRuntimeGeminiConfig()
assert.equal((await secretStore.getRuntimeGeminiStatus()).configured, false)
await fs.rm(tempDir, { recursive: true, force: true })

console.log('Admin secret security checks passed.')
