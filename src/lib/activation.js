// =============================================================================
// Kode Aktivasi via Supabase — Pencarian & validasi kode (mode Supabase)
// =============================================================================
// Flow:
// 1. User masukkan kode aktivasi
// 2. Cek tabel public.activation_codes (anon access)
// 3. Kalau valid → auto-buat akun Supabase Auth + langsung login
// 4. Fallback: master code & bundled codes (mode lokal)

import { supabase } from './supabase.js'
import { MASTER_CODE, getStoredLicense, saveLicense, clearLicense } from './codes.js'

// ---- Pencarian kode aktivasi di Supabase ----
export async function lookupActivationCode(code) {
  if (!supabase) return null
  const clean = String(code).trim().toUpperCase()
  const { data, error } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', clean)
    .maybeSingle()
  if (error) {
    console.error('lookupActivationCode error:', error)
    return null
  }
  return data
}

// ---- Register user via kode aktivasi ----
export async function activateAndRegister(code) {
  const clean = String(code).trim().toUpperCase()

  // 1. Master code → skip Supabase Auth, langsung lisensi
  if (clean === MASTER_CODE) {
    saveLicense(clean, 'pro', { via: 'master' })
    return { ok: true, mode: 'master', message: 'Master code diterima — akses penuh' }
  }

  // 2. Cek bundled codes (fallback mode lokal tanpa Supabase)
  if (!supabase) {
    const { validateCode, tryLoadLocalCodes, fetchRemoteCodes, saveLocalCodes } = await import('./codes.js')
    let bundledCodes = tryLoadLocalCodes()
    try {
      const remote = await fetchRemoteCodes()
      if (Array.isArray(remote)) { bundledCodes = remote; saveLocalCodes(remote) }
    } catch {}
    const result = validateCode(clean, bundledCodes)
    if (!result.valid) return { ok: false, error: result.error || 'Kode aktivasi tidak valid' }
    saveLicense(clean, result.tier)
    return { ok: true, mode: 'license', tier: result.tier, message: 'Kode lisensi diterima' }
  }

  // 3. Cek kode di Supabase
  const activation = await lookupActivationCode(clean)
  if (!activation) {
    return { ok: false, error: 'Kode aktivasi tidak ditemukan' }
  }
  if (activation.used) {
    return { ok: false, error: 'Kode aktivasi sudah digunakan' }
  }

  // 4. Buat akun Supabase Auth otomatis
  //    Email = code + domain internal (tidak perlu email beneran)
  const email = `${clean.toLowerCase()}@kbc.internal`
  const password = generatePassword()

  // Simpan session admin saat ini (kalau ada) supaya tidak hilang
  const { data: adminSession } = await supabase.auth.getSession()
  const adminAccess = adminSession?.session?.access_token
  const adminRefresh = adminSession?.session?.refresh_token

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama: activation.nama,
        role: activation.role,
        pengawas_id: activation.pengawas_id || '',
        madrasah_id: activation.madrasah_id || '',
        activation_code: clean
      }
    }
  })

  if (signUpError) {
    if (signUpError.message?.includes('already registered')) {
      // User sudah pernah aktivasi — coba langsung login
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
      if (loginErr) return { ok: false, error: 'Akun sudah ada. Gunakan fitur "Lupa Password" atau hubungi admin.' }
      saveLicense(clean, 'pro')
      return { ok: true, mode: 'relogin', message: 'Akun sudah teraktivasi sebelumnya' }
    }
    return { ok: false, error: signUpError.message }
  }

  // 5. Restore session admin (kalau ada) — user baru sudah terdaftar, trigger handle_new_user sudah jalan
  if (adminAccess && adminRefresh) {
    await supabase.auth.setSession({ access_token: adminAccess, refresh_token: adminRefresh })
  }

  // 6. Login dengan user baru
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

  if (loginError) {
    return { ok: false, error: 'Akun dibuat tapi gagal login: ' + loginError.message }
  }

  // 7. Simpan lisensi
  saveLicense(clean, 'pro', { via: 'supabase', role: activation.role })

  return {
    ok: true,
    mode: 'activated',
    nama: activation.nama,
    role: activation.role,
    message: `Aktivasi berhasil! Selamat datang, ${activation.nama}.`
  }
}

// ---- Password generator (internal, tidak perlu user tahu) ----
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const specials = '!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < 14; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  pwd += specials[Math.floor(Math.random() * specials.length)]
  return pwd
}

// ---- Re-export dr codes.js untuk kompatibilitas ----
export { MASTER_CODE } from './codes.js'
export { getStoredLicense, saveLicense, clearLicense } from './codes.js'