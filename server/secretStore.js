import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const DATA_DIR = process.env.ADVISORY_DATA_DIR || path.resolve(process.cwd(), 'data')
const SECRET_FILE = path.join(DATA_DIR, 'runtime-secrets.json')
const VERSION = 1

function getEncryptionSecret() {
  const secret = process.env.ADMIN_ENCRYPTION_SECRET || process.env.ADMIN_PASSWORD
  if (!secret || secret.length < 12) {
    throw new Error('Admin secret encryption is not configured. Set ADMIN_PASSWORD to at least 12 characters or set ADMIN_ENCRYPTION_SECRET.')
  }
  return secret
}

function deriveKey(secret, salt) {
  return scryptSync(secret, salt, 32)
}

async function readEnvelope() {
  try {
    return JSON.parse(await fs.readFile(SECRET_FILE, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw new Error('Unable to read the encrypted runtime secret store.')
  }
}

async function writeEnvelope(envelope) {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 })
  const tempFile = `${SECRET_FILE}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tempFile, `${JSON.stringify(envelope, null, 2)}\n`, { mode: 0o600 })
  await fs.rename(tempFile, SECRET_FILE)
  try { await fs.chmod(SECRET_FILE, 0o600) } catch {}
}

function encryptPayload(payload) {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = deriveKey(getEncryptionSecret(), salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    version: VERSION,
    algorithm: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    updatedAt: new Date().toISOString()
  }
}

function decryptEnvelope(envelope) {
  if (!envelope) return null
  if (envelope.version !== VERSION || envelope.algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted runtime secret format.')
  }

  try {
    const salt = Buffer.from(envelope.salt, 'base64')
    const iv = Buffer.from(envelope.iv, 'base64')
    const tag = Buffer.from(envelope.tag, 'base64')
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64')
    const key = deriveKey(getEncryptionSecret(), salt)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    return JSON.parse(plaintext)
  } catch {
    throw new Error('Unable to decrypt the runtime secret store. Check the admin encryption secret.')
  }
}

export async function getRuntimeGeminiConfig() {
  const envelope = await readEnvelope()
  const payload = decryptEnvelope(envelope)
  if (!payload?.gemini?.apiKey) return null
  return {
    apiKey: payload.gemini.apiKey,
    model: payload.gemini.model || null,
    imageModel: payload.gemini.imageModel || null,
    updatedAt: envelope.updatedAt || null
  }
}

export async function saveRuntimeGeminiConfig({ apiKey, model, imageModel }) {
  const cleanKey = typeof apiKey === 'string' ? apiKey.trim() : ''
  if (cleanKey.length < 20 || cleanKey.length > 512) {
    throw new Error('Enter a valid Gemini API key.')
  }

  const payload = {
    gemini: {
      apiKey: cleanKey,
      model: typeof model === 'string' && model.trim() ? model.trim().slice(0, 120) : 'gemini-2.5-flash',
      imageModel: typeof imageModel === 'string' && imageModel.trim() ? imageModel.trim().slice(0, 120) : 'gemini-3.1-flash-image'
    }
  }

  await writeEnvelope(encryptPayload(payload))
  return getRuntimeGeminiStatus()
}

export async function clearRuntimeGeminiConfig() {
  try {
    await fs.unlink(SECRET_FILE)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw new Error('Unable to remove the encrypted Gemini settings.')
  }
}

export async function getRuntimeGeminiStatus() {
  const config = await getRuntimeGeminiConfig()
  if (!config) return { configured: false, last4: null, model: null, imageModel: null, updatedAt: null }
  return {
    configured: true,
    last4: config.apiKey.slice(-4),
    model: config.model,
    imageModel: config.imageModel,
    updatedAt: config.updatedAt
  }
}

export function getRuntimeSecretPath() {
  return SECRET_FILE
}
