import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useData } from './DataContext.jsx'
import { SUPABASE_ENABLED, supabase } from '../lib/supabase.js'
import { LOCAL_ONLY_MODE } from '../lib/appMode.js'
import { getStoredLicense, saveLicense } from '../lib/codes.js'

const AUTH_KEY = 'kbc_auth_v1'
const TRIAL_USER_KEY = 'kbc_trial_user_v1'
const LOCAL_USER_KEY = 'kbc_local_user_v1'
const REGISTERED_USERS_KEY = 'kbc_registered_users_v1'

function loadTrialUser() {
  // Trial user hanya valid kalau lisensi tier=demo masih aktif
  const lic = getStoredLicense()
  if (!lic || lic.tier !== 'demo') {
    try { localStorage.removeItem(TRIAL_USER_KEY) } catch {}
    return null
  }
  try {
    const raw = localStorage.getItem(TRIAL_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadLocalUser() {
  // Local admin user (mode LOCAL_ONLY_MODE) hanya valid kalau lisensi masih aktif
  if (!LOCAL_ONLY_MODE) return null
  const lic = getStoredLicense()
  if (!lic) return null
  if (lic.expiresAt && Date.now() > lic.expiresAt) {
    try { localStorage.removeItem(LOCAL_USER_KEY) } catch {}
    return null
  }
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { state } = useData()
  const [user, setUser] = useState(() => {
    // Local user (mode LOCAL_ONLY_MODE) override semua
    const local = loadLocalUser()
    if (local) return local
    // Trial user override Supabase mode
    const trial = loadTrialUser()
    if (trial) return trial
    if (SUPABASE_ENABLED && !LOCAL_ONLY_MODE) return null
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [authLoading, setAuthLoading] = useState(
    SUPABASE_ENABLED && !LOCAL_ONLY_MODE && !loadTrialUser() && !loadLocalUser()
  )

  // ----- Local mode: sync user dari users state -----
  useEffect(() => {
    if (SUPABASE_ENABLED || !user) return
    if (user.isTrial || user.isLocalAdmin) return // local admin/trial tidak perlu sync ke state.users
    if (user.source === 'registered') return // registered users (from activation) tidak di state.users
    const found = state.users.find((u) => u.id === user.id)
    if (!found) {
      setUser(null)
      localStorage.removeItem(AUTH_KEY)
      return
    }
    if (JSON.stringify(found) !== JSON.stringify(user)) {
      setUser(found)
      localStorage.setItem(AUTH_KEY, JSON.stringify(found))
    }
  }, [state.users, user])

  // ----- Supabase mode: subscribe ke session + load profile -----
  useEffect(() => {
    if (!SUPABASE_ENABLED) return
    if (LOCAL_ONLY_MODE) return // mode lokal: jangan subscribe ke Supabase auth
    if (user?.isTrial || user?.isLocalAdmin) { setAuthLoading(false); return }
    let unsubscribed = false

    async function loadProfile(session) {
      if (!session?.user) {
        setUser(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (error) {
        console.error('Load profile error:', error)
        // Fallback: ambil role dari user_metadata (di-set saat signUp)
        const meta = session.user.user_metadata || {}
        setUser({
          id: session.user.id,
          username: session.user.email,
          nama: meta.nama || session.user.email,
          role: meta.role || 'pengawas',
          pengawasId: meta.pengawas_id || null,
          madrasahId: meta.madrasah_id || null
        })
        return
      }
      if (data) {
        setUser({
          id: data.id, username: data.username || session.user.email, nama: data.nama,
          role: data.role, pengawasId: data.pengawas_id, madrasahId: data.madrasah_id
        })
      } else {
        // Profile belum ada (trigger handle_new_user gagal). Fallback ke metadata signUp.
        const meta = session.user.user_metadata || {}
        setUser({
          id: session.user.id,
          username: session.user.email,
          nama: meta.nama || session.user.email,
          role: meta.role || 'pengawas',
          pengawasId: meta.pengawas_id || null,
          madrasahId: meta.madrasah_id || null
        })
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!unsubscribed) {
        loadProfile(data?.session).finally(() => setAuthLoading(false))
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!unsubscribed) loadProfile(session)
    })

    return () => {
      unsubscribed = true
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const login = useCallback(
    async (username, password) => {
      if (SUPABASE_ENABLED) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: String(username).trim(), password
        })
        if (error) return { ok: false, error: error.message }
        return { ok: true, user: data.user }
      }
      const uname = String(username).trim().toLowerCase()
      const pass = String(password)

      // 1. Cek state.users (seeded demo users)
      let found = state.users.find(
        (u) => u.username.toLowerCase() === uname && u.password === pass
      )

      // 2. Cek registered users (dari aktivasi kode)
      if (!found) {
        try {
          const registered = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]')
          const regUser = registered.find(
            (u) => u.nama.toLowerCase() === uname && u.password === pass
          )
          if (regUser) {
            // Normalisasi: simpan lowercase untuk konsistensi login
            found = {
              id: regUser.id,
              username: regUser.nama.toLowerCase(),
              nama: regUser.nama,
              role: regUser.role || 'pengawas',
              password: regUser.password,
              pengawasId: null,
              madrasahId: null,
              source: 'registered'
            }
          }
        } catch {}
      }

      if (!found) return { ok: false, error: 'Nama atau password salah' }
      
      // Pastikan ada lisensi untuk registered user (agar ActivationGate lolos)
      const lic = getStoredLicense()
      if (!lic && LOCAL_ONLY_MODE) {
        // Buat lisensi bypass untuk registered user (saveLicense sudah di-import di atas)
        saveLicense('LOGIN-BYPASS', 'pro', { 
          via: 'login-bypass', 
          nama: found.nama,
          role: found.role,
          expiresAt: Date.now() + 365 * 86400000 // 1 tahun
        })
      }
      
      setUser(found)
      localStorage.setItem(AUTH_KEY, JSON.stringify(found))
      return { ok: true, user: found }
    },
    [state.users]
  )

  const logout = useCallback(async () => {
    // Local admin user (mode LOCAL_ONLY_MODE)
    if (user?.isLocalAdmin) {
      try {
        localStorage.removeItem(LOCAL_USER_KEY)
        localStorage.removeItem('kbc_license_v1')
      } catch {}
      setUser(null)
      return
    }
    // Trial user: hapus license + trial user, tidak panggil Supabase signOut
    if (user?.isTrial) {
      try {
        localStorage.removeItem(TRIAL_USER_KEY)
        localStorage.removeItem('kbc_license_v1')
      } catch {}
      setUser(null)
      return
    }
    if (SUPABASE_ENABLED && !LOCAL_ONLY_MODE) {
      await supabase.auth.signOut()
      setUser(null)
      return
    }
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthed: !!user,
      authLoading,
      mode: SUPABASE_ENABLED ? 'supabase' : 'local'
    }),
    [user, login, logout, authLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
