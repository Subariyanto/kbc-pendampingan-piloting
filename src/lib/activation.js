// =============================================================================
// Kode Aktivasi via Supabase — Pencarian & validasi kode (mode Supabase)
// =============================================================================
// Flow baru (gaya e-RHK):
// 1. User daftar: email + password + nama + kode aktivasi
// 2. Kode aktivasi divalidasi ke tabel public.activation_codes
// 3. Akun Supabase Auth dibuat dengan email/password milik user
// 4. Trigger handle_new_user buat profile + tandai kode sebagai used
// 5. Auto-login setelah signUp sukses
//
// Backward-compat: activateAndRegister() lama tetap dipertahankan untuk
// mode lokal (master code / bundled codes) tapi tidak dipakai lagi di
// Supabase mode.

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

// ---- Register user dengan email + password milik user sendiri (flow e-RHK) ----
// User input: email, password, nama, kode aktivasi.
// Kode aktivasi divalidasi → akun Supabase dibuat → auto-login.
export async function registerWithEmailAndCode({ email, password, nama, code }) {
  if (!supabase) {
    return { ok: false, error: 'Mode Supabase belum aktif' }
  }
  const cleanCode = String(code || '').trim().toUpperCase()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanNama = String(nama || '').trim()

  if (!cleanEmail || !password) {
    return { ok: false, error: 'Email dan password wajib diisi' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password minimal 6 karakter' }
  }
  if (!cleanNama) {
    return { ok: false, error: 'Nama wajib diisi' }
  }
  if (!cleanCode) {
    return { ok: false, error: 'Kode aktivasi wajib diisi' }
  }

  // 1. Master code → skip Supabase, langsung lisensi (akun tetap dibuat di Supabase)
  let activationData = null
  if (cleanCode === MASTER_CODE) {
    // Master code: role admin default
    activationData = { role: 'admin', nama: cleanNama, pengawas_id: null, madrasah_id: null }
  } else {
    // 2. Cek kode di tabel activation_codes
    const found = await lookupActivationCode(cleanCode)
    if (!found) {
      return { ok: false, error: 'Kode aktivasi tidak ditemukan' }
    }
    if (found.used) {
      return { ok: false, error: 'Kode aktivasi sudah digunakan oleh user lain' }
    }
    activationData = found
  }

  // 3. Daftar akun di Supabase Auth dengan email/password milik user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        nama: cleanNama,
        role: activationData.role,
        pengawas_id: activationData.pengawas_id || '',
        madrasah_id: activationData.madrasah_id || '',
        activation_code: cleanCode
      }
    }
  })

  if (signUpError) {
    if (signUpError.message?.toLowerCase().includes('already')) {
      return { ok: false, error: 'Email ini sudah terdaftar. Silakan login langsung atau pakai email lain.' }
    }
    return { ok: false, error: signUpError.message || 'Gagal mendaftar' }
  }

  // 4. Auto-login (kalau email confirmation di Supabase di-enable, signUp tidak
  //    langsung kasih session — kita tetap coba signInWithPassword sebagai fallback)
  let session = signUpData?.session
  if (!session) {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail, password
    })
    if (loginError) {
      return {
        ok: true,
        mode: 'pending_confirmation',
        message: 'Akun dibuat. Cek email Bapak/Ibu untuk konfirmasi sebelum login.',
        email: cleanEmail
      }
    }
    session = loginData?.session
  }

  // 5. Simpan lisensi
  saveLicense(cleanCode, 'pro', { via: 'supabase', role: activationData.role })

  return {
    ok: true,
    mode: 'registered',
    nama: cleanNama,
    role: activationData.role,
    email: cleanEmail,
    message: `Pendaftaran berhasil! Selamat datang, ${cleanNama}.`
  }
}

// ---- (Legacy) Aktivasi mode lokal — fallback master code / bundled codes ----
export async function activateAndRegister(code) {
  const clean = String(code).trim().toUpperCase()

  // 1. Master code → skip Supabase Auth, langsung lisensi
  if (clean === MASTER_CODE) {
    saveLicense(clean, 'pro', { via: 'master' })
    return { ok: true, mode: 'master', message: 'Master code diterima — akses penuh' }
  }

  // 2. Mode lokal tanpa Supabase: cek bundled codes
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

  // 3. Mode Supabase: arahkan user ke flow registrasi (email+password)
  return {
    ok: false,
    error: 'Silakan gunakan menu Daftar Akun untuk membuat akun baru dengan kode aktivasi.'
  }
}

// ---- Re-export dr codes.js untuk kompatibilitas ----
export { MASTER_CODE } from './codes.js'
export { getStoredLicense, saveLicense, clearLicense } from './codes.js'