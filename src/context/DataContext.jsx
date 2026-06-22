import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, uid } from '../lib/utils.js'
import { buildSeedData } from '../lib/seed.js'
import { buildDefaultInstrumen } from '../lib/constants.js'
import { SUPABASE_ENABLED, supabase } from '../lib/supabase.js'
import { LOCAL_ONLY_MODE } from '../lib/appMode.js'
import * as repo from '../lib/repository.js'

// Cek trial mode: kalau ada lisensi tier=demo + trial user di localStorage,
// paksa mode lokal supaya tidak panggil Supabase (yang akan ditolak RLS).
function isTrialMode() {
  try {
    const lic = JSON.parse(localStorage.getItem('kbc_license_v1') || 'null')
    if (lic?.tier !== 'demo') return false
    if (lic.expiresAt && Date.now() > lic.expiresAt) return false
    const trialUser = localStorage.getItem('kbc_trial_user_v1')
    return !!trialUser
  } catch { return false }
}

// Data aplikasi pakai Supabase HANYA jika:
// - LOCAL_ONLY_MODE = false (mode multi-tenant Supabase, dimatikan default)
// - Bukan trial mode
const USE_REMOTE = SUPABASE_ENABLED && !LOCAL_ONLY_MODE && !isTrialMode()

const DataContext = createContext(null)

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage', e)
  }
}

export function DataProvider({ children }) {
  const [state, setState] = useState(() => loadFromStorage() ?? buildSeedData())
  const [loading, setLoading] = useState(USE_REMOTE)
  const [remoteError, setRemoteError] = useState(null)

  // Kalau Supabase aktif (dan bukan trial), refresh state dari Supabase saat session berubah.
  useEffect(() => {
    if (!USE_REMOTE) return
    let cancelled = false

    const fetchSnapshot = async (session) => {
      if (!session) {
        // Tidak login: kosongkan data sensitif, biarkan settings & instrumen default
        if (!cancelled) setLoading(false)
        return
      }
      try {
        if (!cancelled) setLoading(true)
        const snapshot = await repo.loadSnapshot()
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          ...snapshot,
          settings: snapshot.settings ?? prev.settings,
          instrumen: snapshot.instrumen?.length ? snapshot.instrumen : prev.instrumen,
          users: prev.users
        }))
        setRemoteError(null)
      } catch (err) {
        console.error('Gagal load Supabase snapshot:', err)
        if (!cancelled) setRemoteError(err.message || String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Initial load: kalau ada session tersimpan, fetch langsung
    supabase.auth.getSession().then(({ data }) => fetchSnapshot(data?.session))

    // Re-fetch tiap auth state change (login / logout / token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        fetchSnapshot(session)
      } else if (event === 'SIGNED_OUT') {
        setRemoteError(null)
      }
    })

    return () => {
      cancelled = true
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!USE_REMOTE) saveToStorage(state)
  }, [state])

  const upsertCollection = useCallback(async (key, item) => {
    if (USE_REMOTE) {
      // Mode Supabase: kirim ke server dulu, baru update local pakai data dari server.
      // ID dibiarkan kosong saat insert agar Postgres yang generate UUID.
      const isUpdate = !!item.id
      const tempId = isUpdate ? item.id : `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      // Optimistic add (gunakan tempId saat insert)
      setState((prev) => {
        const list = prev[key] ?? []
        if (isUpdate && list.some((x) => x.id === item.id)) {
          return { ...prev, [key]: list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) }
        }
        return { ...prev, [key]: [...list, { ...item, id: tempId, _pending: true }] }
      })
      try {
        const remote = await repo.upsertItem(key, isUpdate ? item : { ...item, id: undefined })
        if (remote?.id) {
          // Replace tempId / set id real dari server
          setState((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((x) =>
              (x.id === tempId || x.id === remote.id || x.id === item.id)
                ? { ...x, ...item, id: remote.id, _pending: false }
                : x
            )
          }))
        }
        setRemoteError(null)
      } catch (err) {
        console.error('Supabase upsert error:', err)
        // Rollback insert kalau gagal
        if (!isUpdate) {
          setState((prev) => ({ ...prev, [key]: (prev[key] || []).filter((x) => x.id !== tempId) }))
        }
        setRemoteError(err.message)
        throw err
      }
      return
    }

    // Mode lokal: pakai uid() lokal
    const id = item.id ?? uid(key)
    const next = { ...item, id }
    setState((prev) => {
      const list = prev[key] ?? []
      if (list.some((x) => x.id === id)) {
        return { ...prev, [key]: list.map((x) => (x.id === id ? { ...x, ...next } : x)) }
      }
      return { ...prev, [key]: [...list, next] }
    })
  }, [])

  const removeFromCollection = useCallback(async (key, id) => {
    setState((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((x) => x.id !== id) }))
    if (USE_REMOTE) {
      try { await repo.deleteItem(key, id) } catch (err) {
        console.error('Supabase delete error:', err)
        setRemoteError(err.message)
      }
    }
  }, [])

  const updateSettings = useCallback(async (patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    if (USE_REMOTE) {
      try { await repo.updateSettingsRemote({ ...state.settings, ...patch }) } catch (err) { setRemoteError(err.message) }
    }
  }, [state.settings])

  const setInstrumenLocal = useCallback(async (instrumen) => {
    setState((prev) => ({ ...prev, instrumen }))
    if (USE_REMOTE) {
      try { await repo.replaceInstrumen(instrumen) } catch (err) { setRemoteError(err.message) }
    }
  }, [])

  const resetInstrumen = useCallback(() => {
    setInstrumenLocal(buildDefaultInstrumen())
  }, [setInstrumenLocal])

  const resetAll = useCallback(() => {
    if (USE_REMOTE) {
      console.warn('Reset data demo dinonaktifkan saat Supabase aktif. Hapus data lewat dashboard Supabase.')
      return
    }
    const fresh = buildSeedData()
    setState(fresh)
    saveToStorage(fresh)
  }, [])

  const restoreAll = useCallback(async (data) => {
    if (!data || typeof data !== 'object') throw new Error('Format backup tidak valid')
    const required = ['settings', 'instrumen', 'pengawas', 'madrasah']
    for (const k of required) {
      if (!data[k]) throw new Error(`Field "${k}" tidak ditemukan pada backup`)
    }
    setState(data)
    if (USE_REMOTE) {
      await repo.pushFullSnapshot(data)
    }
  }, [])

  const value = useMemo(
    () => ({
      state, loading, remoteError,
      mode: USE_REMOTE ? 'supabase' : (isTrialMode() ? 'trial' : 'local'),
      addOrUpdate: upsertCollection,
      remove: removeFromCollection,
      updateSettings,
      setInstrumen: setInstrumenLocal,
      resetInstrumen,
      resetAll, restoreAll,
      replace: setState
    }),
    [state, loading, remoteError, upsertCollection, removeFromCollection, updateSettings, setInstrumenLocal, resetInstrumen, resetAll, restoreAll]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
