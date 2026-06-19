import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, uid } from '../lib/utils.js'
import { buildSeedData } from '../lib/seed.js'
import { buildDefaultInstrumen } from '../lib/constants.js'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
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
  const [state, setState] = useState(() => loadFromStorage() ?? buildSeedData())
  const [loading, setLoading] = useState(SUPABASE_ENABLED)
  const [remoteError, setRemoteError] = useState(null)

  // Kalau Supabase aktif, refresh state dari Supabase saat mount.
  useEffect(() => {
    if (!SUPABASE_ENABLED) return
    let cancel = false
    const run = async () => {
      try {
        setLoading(true)
        const snapshot = await repo.loadSnapshot()
        if (cancel) return
        setState((prev) => ({
          ...prev,
          ...snapshot,
          settings: snapshot.settings ?? prev.settings,
          instrumen: snapshot.instrumen?.length ? snapshot.instrumen : prev.instrumen,
          users: prev.users // user dikelola Supabase Auth, biarkan
        }))
        setRemoteError(null)
      } catch (err) {
        console.error('Gagal load Supabase snapshot:', err)
        setRemoteError(err.message || String(err))
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    run()
    return () => { cancel = true }
  }, [])

  useEffect(() => {
    if (!SUPABASE_ENABLED) saveToStorage(state)
  }, [state])

  const upsertCollection = useCallback(async (key, item) => {
    const id = item.id ?? uid(key)
    const next = { ...item, id }
    // optimistic local
    setState((prev) => {
      const list = prev[key] ?? []
      if (list.some((x) => x.id === id)) {
        return { ...prev, [key]: list.map((x) => (x.id === id ? { ...x, ...next } : x)) }
      }
      return { ...prev, [key]: [...list, next] }
    })
    if (SUPABASE_ENABLED) {
      try {
        const remote = await repo.upsertItem(key, next)
        // sync id (kalau tadi pakai uid sementara, server bisa balikin row dengan id berbeda di insert pertama)
        setState((prev) => ({
          ...prev,
          [key]: prev[key].map((x) => (x.id === id ? { ...x, id: remote.id ?? id } : x))
        }))
      } catch (err) {
        console.error('Supabase upsert error:', err)
        setRemoteError(err.message)
      }
    }
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
