import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, uid } from '../lib/utils.js'
import { buildSeedData } from '../lib/seed.js'
import { buildDefaultInstrumen } from '../lib/constants.js'

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

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  // Generic CRUD helpers
  const upsertCollection = useCallback((key, item) => {
    setState((prev) => {
      const list = prev[key] ?? []
      if (item.id && list.some((x) => x.id === item.id)) {
        return { ...prev, [key]: list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) }
      }
      return { ...prev, [key]: [...list, { ...item, id: item.id ?? uid(key) }] }
    })
  }, [])

  const removeFromCollection = useCallback((key, id) => {
    setState((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((x) => x.id !== id) }))
  }, [])

  // Settings
  const updateSettings = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  // Instrumen
  const setInstrumen = useCallback((instrumen) => {
    setState((prev) => ({ ...prev, instrumen }))
  }, [])

  const resetInstrumen = useCallback(() => {
    setState((prev) => ({ ...prev, instrumen: buildDefaultInstrumen() }))
  }, [])

  const resetAll = useCallback(() => {
    const fresh = buildSeedData()
    setState(fresh)
    saveToStorage(fresh)
  }, [])

  const restoreAll = useCallback((data) => {
    if (!data || typeof data !== 'object') throw new Error('Format backup tidak valid')
    const required = ['settings', 'instrumen', 'pengawas', 'madrasah']
    for (const k of required) {
      if (!data[k]) throw new Error(`Field "${k}" tidak ditemukan pada backup`)
    }
    setState(data)
  }, [])

  const value = useMemo(
    () => ({
      state,
      // collections
      addOrUpdate: upsertCollection,
      remove: removeFromCollection,
      // settings & instrumen
      updateSettings,
      setInstrumen,
      resetInstrumen,
      // global
      resetAll,
      restoreAll,
      replace: setState
    }),
    [state, upsertCollection, removeFromCollection, updateSettings, setInstrumen, resetInstrumen, resetAll, restoreAll]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
