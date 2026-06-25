// =============================================================================
// signedLicense.js — Sistem lisensi offline pakai HMAC-SHA256
// =============================================================================
// Kode lisensi: KBC-{TIER}-{TS}-{NONCE}-{SIG}
//   TIER : PRO | BASIC | TRIAL5  (kategori akses & expiry)
//   TS   : timestamp issuedAt dalam base36 (~9 chars)
//   NONCE: random 6 chars base32 (untuk anti-collision)
//   SIG  : HMAC-SHA256(secret, "${TIER}|${TS}|${NONCE}") truncated ke 12 chars base32
//
// Validasi:
//   1. Parse kode jadi 4 segmen
//   2. Hitung ulang HMAC dari payload
//   3. Bandingkan dengan SIG di kode
//   4. Kalau cocok -> kode valid, ambil tier untuk tentukan expiry
//
// Catatan keamanan:
//   - Secret di-bundle di build (Vite env). Pengguna teknis bisa extract.
//   - Mitigasi: rotasi secret kalau pernah leak (rebuild + invalidate semua kode lama)
//   - Cocok untuk audience low-skill (pengawas madrasah).
// =============================================================================

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' // base32 (no 0/1/8/9 utk hindari ambiguitas)
const TIERS = {
  PRO: { tier: 'pro', expiryDays: 0, label: 'Pro Lifetime' },
  BASIC: { tier: 'basic', expiryDays: 0, label: 'Basic Lifetime' },
  TRIAL30: { tier: 'demo', expiryDays: 30, label: 'Trial 30 Hari' }
}

export const TIER_OPTIONS = Object.entries(TIERS).map(([key, val]) => ({ key, ...val }))

function getSecret() {
  const s = import.meta.env.VITE_LICENSE_SECRET
  if (!s) {
    // Fallback default — WAJIB di-replace di production via .env
    console.warn('[signedLicense] VITE_LICENSE_SECRET tidak di-set, pakai fallback')
    return 'kbc-pokjawas-jember-default-secret-2026-rotate-me'
  }
  return s
}

// HMAC-SHA256 via Web Crypto API
async function hmacSign(payload, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return new Uint8Array(sigBuf)
}

// Encode bytes ke base32 (hanya pakai alfabet aman, no padding)
function bytesToBase32(bytes, length = null) {
  let bits = 0
  let value = 0
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += ALPHABET[(value >>> bits) & 0x1f]
      if (length && out.length >= length) return out
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  return length ? out.slice(0, length) : out
}

function randomBase32(length = 6) {
  const bytes = new Uint8Array(Math.ceil((length * 5) / 8))
  crypto.getRandomValues(bytes)
  return bytesToBase32(bytes, length)
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generate kode lisensi yang ditandatangani.
 * @param {string} tierKey - PRO | BASIC | TRIAL5 | TRIAL7 | TRIAL30
 * @returns {Promise<{code, tier, expiryDays, issuedAt, nonce}>}
 */
export async function generateSignedCode(tierKey) {
  const tierDef = TIERS[tierKey]
  if (!tierDef) throw new Error(`Tier tidak dikenal: ${tierKey}`)

  const year = new Date().getFullYear()
  const nonce = randomBase32(4)
  // Tanda tangan pendek (3 chars) untuk validasi offline
  const payload = `${tierKey}|${year}|${nonce}`
  const sigBytes = await hmacSign(payload, getSecret())
  const sig = bytesToBase32(sigBytes, 3)
  const code = `KBC-${year}-${nonce}${sig}`

  return {
    code,
    tierKey,
    tier: tierDef.tier,
    expiryDays: tierDef.expiryDays,
    label: tierDef.label,
    issuedAt: Date.now(),
    nonce
  }
}

/**
 * Verifikasi kode lisensi offline.
 * @param {string} code
 * @returns {Promise<{valid, tier?, expiryDays?, label?, error?}>}
 */
export async function verifySignedCode(code) {
  const clean = String(code || '').trim().toUpperCase()
  if (!clean) return { valid: false, error: 'Kode kosong' }

  const parts = clean.split('-')

  // Format baru: KBC-YYYY-XXXXXXX (year + 4 nonce + 3 sig = 7 chars)
  if (parts.length === 3 && parts[0] === 'KBC') {
    const [, yearStr, tail] = parts
    if (!/^\d{4}$/.test(yearStr) || tail.length !== 7) {
      return { valid: false, error: 'Format kode tidak valid' }
    }
    const nonce = tail.slice(0, 4)
    const sig = tail.slice(4, 7)

    for (const [tierKey, tierDef] of Object.entries(TIERS)) {
      const payload = `${tierKey}|${yearStr}|${nonce}`
      const expectedSigBytes = await hmacSign(payload, getSecret())
      const expectedSig = bytesToBase32(expectedSigBytes, 3)
      if (sig === expectedSig) {
        return {
          valid: true,
          tierKey,
          tier: tierDef.tier,
          expiryDays: tierDef.expiryDays,
          label: tierDef.label,
          issuedAt: parseInt(yearStr) ? new Date(parseInt(yearStr), 0, 1).getTime() : Date.now(),
          nonce
        }
      }
    }
    return { valid: false, error: 'Kode tidak valid atau salah ketik' }
  }

  // Format lama: KBC-TIER-TS-NONCE-SIG (backward compat)
  if (parts.length === 5 && parts[0] === 'KBC') {
    const [, tierKey, ts, nonce, sig] = parts
    const tierDef = TIERS[tierKey]
    if (!tierDef) {
      return { valid: false, error: `Tier "${tierKey}" tidak dikenal` }
    }
    if (!/^[0-9A-Z]+$/.test(ts) || nonce.length !== 6 || sig.length !== 12) {
      return { valid: false, error: 'Format kode tidak valid' }
    }
    const payload = `${tierKey}|${ts}|${nonce}`
    const expectedSigBytes = await hmacSign(payload, getSecret())
    const expectedSig = bytesToBase32(expectedSigBytes, 12)
    if (sig !== expectedSig) {
      return { valid: false, error: 'Kode tidak valid atau salah ketik' }
    }
    return {
      valid: true,
      tierKey,
      tier: tierDef.tier,
      expiryDays: tierDef.expiryDays,
      label: tierDef.label,
      issuedAt: parseInt(ts, 36),
      nonce
    }
  }

  return { valid: false, error: 'Format kode tidak valid' }
}

// =============================================================================
// REVOKED LIST (manual oleh admin via export/import JSON)
// =============================================================================
const REVOKED_KEY = 'kbc_revoked_codes_v1'

export function getRevokedCodes() {
  try {
    return JSON.parse(localStorage.getItem(REVOKED_KEY) || '[]')
  } catch { return [] }
}

export function addRevokedCode(code) {
  const list = getRevokedCodes()
  const clean = String(code).trim().toUpperCase()
  if (!list.includes(clean)) list.push(clean)
  localStorage.setItem(REVOKED_KEY, JSON.stringify(list))
}

export function removeRevokedCode(code) {
  const clean = String(code).trim().toUpperCase()
  const list = getRevokedCodes().filter((c) => c !== clean)
  localStorage.setItem(REVOKED_KEY, JSON.stringify(list))
}

export function isCodeRevoked(code) {
  return getRevokedCodes().includes(String(code).trim().toUpperCase())
}

// =============================================================================
// ADMIN: catatan kode yang sudah Yanto issue (statistik)
// =============================================================================
const ADMIN_CODES_KEY = 'kbc_admin_codes_v1'

export function getAdminCodes() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_CODES_KEY) || '[]')
  } catch { return [] }
}

export function saveAdminCodes(list) {
  localStorage.setItem(ADMIN_CODES_KEY, JSON.stringify(list))
}

export function addAdminCode(record) {
  const list = getAdminCodes()
  list.unshift(record) // newest first
  saveAdminCodes(list)
  return list
}

export function updateAdminCode(code, patch) {
  const list = getAdminCodes()
  const idx = list.findIndex((r) => r.code === code)
  if (idx === -1) return list
  list[idx] = { ...list[idx], ...patch }
  saveAdminCodes(list)
  return list
}

export function deleteAdminCode(code) {
  const list = getAdminCodes().filter((r) => r.code !== code)
  saveAdminCodes(list)
  return list
}
