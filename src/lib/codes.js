// Kode aktivasi lisensi KBC Pendampingan Piloting
// Pola: localStorage > REMOTE_CODES (gh-pages) > BUNDLED_CODES > MASTER_CODE

import { uid } from './utils.js'

// Master code — selalu valid, buat Yanto & admin internal
export const MASTER_CODE = 'KBC-POKJAWAS-JEMBER-2026'

// Prefixes: tier kode (bisa dipakai untuk pelacakan)
export const TIER_LABELS = {
  pro: 'Pro (Full Akses)',
  basic: 'Basic (Read-only)',
  demo: 'Trial (5 hari)'
}

export const TIER_DAYS = {
  pro: 0,    // unlimited
  basic: 0,  // unlimited
  demo: 5    // trial 5 hari
}

const STORAGE_KEY = 'kbc_license_v1'

// Simpan info lisensi yang sudah diaktivasi di localStorage browser
export function getStoredLicense() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.code || !parsed.activatedAt) return null
    // Cek expiry (demo tier)
    if (parsed.tier === 'demo' && parsed.expiresAt) {
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

export function saveLicense(code, tier, deviceInfo = {}) {
  const expiresAt = TIER_DAYS[tier]
    ? Date.now() + TIER_DAYS[tier] * 86400000
    : 0
  const license = {
    code,
    tier: tier || 'pro',
    deviceInfo,
    activatedAt: Date.now(),
    expiresAt
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(license))
  return license
}

export function clearLicense() {
  localStorage.removeItem(STORAGE_KEY)
}

// Cek kode di array codes
export function findCode(code, codes) {
  return codes.find(
    (c) => c.code.toLowerCase() === String(code).trim().toLowerCase()
  )
}

// Validasi kode: cek local dulu, baru bundle, baru master
export function validateCode(code, bundledCodes = []) {
  const clean = String(code).trim()

  // 1. Master code
  if (clean === MASTER_CODE) {
    return { valid: true, tier: 'pro', via: 'master' }
  }

  // 2. Cached/local codes
  const stored = tryLoadLocalCodes()
  const localMatch = findCode(clean, stored)
  if (localMatch && !localMatch.used) {
    return { valid: true, tier: localMatch.tier || 'basic', via: 'local' }
  }

  // 3. Bundled codes
  const bundledMatch = findCode(clean, bundledCodes)
  if (bundledMatch && !bundledMatch.used) {
    return { valid: true, tier: bundledMatch.tier || 'basic', via: 'bundled' }
  }

  return { valid: false, error: 'Kode aktivasi tidak ditemukan' }
}

// Simpan codes dari remote (gh-pages) ke localStorage
export function tryLoadLocalCodes() {
  try {
    const raw = localStorage.getItem('kbc_codes_cache_v1')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalCodes(codes) {
  try {
    localStorage.setItem('kbc_codes_cache_v1', JSON.stringify(codes))
  } catch {}
}

// Format kode random: KBC-XXXX-XXXX
export function generateCode(tier = 'pro') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part = ''
  for (let i = 0; i < 4; i++) part += chars[Math.floor(Math.random() * chars.length)]
  const code = `KBC-${part}-${genSegment(chars)}`
  return {
    id: uid('code'),
    code,
    tier,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
    note: ''
  }
}

function genSegment(chars) {
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// Lookup tier dari kode
export function getCodeTier(code, bundledCodes = []) {
  const result = validateCode(code, bundledCodes)
  return result.tier || null
}

// Fetch codes dari remote gh-pages
export async function fetchRemoteCodes(repoUrl = null) {
  // Cache buster: timestamp
  const ts = Date.now()
  const url = repoUrl || 'https://subariyanto.github.io/kbc-pendampingan-piloting/data/codes.json'
  const res = await fetch(`${url}?t=${ts}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}