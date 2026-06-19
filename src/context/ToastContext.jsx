import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { uid } from '../lib/utils.js'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast) => {
      const id = uid('toast')
      const item = { id, tone: 'navy', timeout: 3500, ...toast }
      setToasts((prev) => [...prev, item])
      if (item.timeout) {
        setTimeout(() => remove(id), item.timeout)
      }
      return id
    },
    [remove]
  )

  const api = useMemo(
    () => ({
      success: (message) => push({ message, tone: 'emerald' }),
      error: (message) => push({ message, tone: 'rose', timeout: 5000 }),
      info: (message) => push({ message, tone: 'navy' }),
      warn: (message) => push({ message, tone: 'gold' }),
      remove
    }),
    [push, remove]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onClose }) {
  if (!toasts.length) return null
  const toneClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    navy: 'bg-navy-50 border-navy-200 text-navy-800',
    gold: 'bg-gold-50 border-gold-200 text-gold-800'
  }
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-card text-sm flex items-start gap-2 ${toneClasses[t.tone] || toneClasses.navy}`}
          role="status"
        >
          <span className="flex-1 leading-relaxed">{t.message}</span>
          <button
            onClick={() => onClose(t.id)}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
