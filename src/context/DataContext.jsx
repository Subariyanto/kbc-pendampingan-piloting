import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, uid } from '../lib/utils.js'
import { buildEmptyData } from '../lib/seed.js'
import { buildDefaultInstrumen } from '../lib/constants.js'
import { SUPABASE_ENABLED, supabase } from '../lib/supabase.js'
import * as repo from '../lib/repository.js'

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
  const [state, setState] = useState(() => loadFromStorage() ?? buildEmptyData())
  const [loading, setLoading] = useState(SUPABASE_ENABLED)
  const [remoteError, setRemoteError] = useState(null)

  // Kalau Supabase aktif, refresh state dari Supabase saat session berubah (login/logout/initial).
  useEffect(() => {
    if (!SUPABASE_ENABLED) return
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
    if (!SUPABASE_ENABLED) saveToStorage(state)
  }, [state])

  const upsertCollection = useCallback(async (key, item) => {
    if (SUPABASE_ENABLED) {
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
    if (SUPABASE_ENABLED) {
      try { await repo.deleteItem(key, id) } catch (err) {
        console.error('Supabase delete error:', err)
        setRemoteError(err.message)
      }
    }
  }, [])

  const updateSettings = useCallback(async (patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    if (SUPABASE_ENABLED) {
      try { await repo.updateSettingsRemote({ ...state.settings, ...patch }) } catch (err) { setRemoteError(err.message) }
    }
  }, [state.settings])

  const setInstrumenLocal = useCallback(async (instrumen) => {
    setState((prev) => ({ ...prev, instrumen }))
    if (SUPABASE_ENABLED) {
      try { await repo.replaceInstrumen(instrumen) } catch (err) { setRemoteError(err.message) }
    }
  }, [])

  const resetInstrumen = useCallback(() => {
    setInstrumenLocal(buildDefaultInstrumen())
  }, [setInstrumenLocal])

  const resetAll = useCallback(() => {
    if (SUPABASE_ENABLED) {
      console.warn('Reset data demo dinonaktifkan saat Supabase aktif. Hapus data lewat dashboard Supabase.')
      return
    }
    const fresh = buildEmptyData()
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
    if (SUPABASE_ENABLED) {
      await repo.pushFullSnapshot(data)
    }
  }, [])

  const value = useMemo(
    () => ({
      state, loading, remoteError, mode: SUPABASE_ENABLED ? 'supabase' : 'local',
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
