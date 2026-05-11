import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto'

// Envelope format for stored secrets:  v1:<ivB64>:<tagB64>:<ciphertextB64>
// Anything not starting with "v1:" is treated as legacy plaintext and re-encrypted on next write.

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY not set')
  // Accept hex (64 chars) or base64 (44 chars) — both decode to 32 bytes
  const buf = raw.length === 64 ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -hex 32`)')
  return buf
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decryptSecret(value: string | null | undefined): string {
  if (!value) return ''
  if (!value.startsWith('v1:')) return value // legacy plaintext — caller should re-encrypt on next write
  const [, ivB64, tagB64, ctB64] = value.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// ---------- HMAC for tracking link integrity ----------

function getTrackingSecret(): string {
  const s = process.env.TRACKING_SECRET || process.env.ENCRYPTION_KEY
  if (!s) throw new Error('TRACKING_SECRET (or ENCRYPTION_KEY) not set')
  return s
}

export function sign(...parts: string[]): string {
  return createHmac('sha256', getTrackingSecret())
    .update(parts.join('|'))
    .digest('base64url')
    .slice(0, 22) // 132 bits — plenty for link integrity, keeps URLs short
}

export function verifySig(sig: string, ...parts: string[]): boolean {
  const expected = sign(...parts)
  if (sig.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}
