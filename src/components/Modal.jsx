import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden="true" />
      <div className={`relative bg-white w-full ${sizes[size] || sizes.md} rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Tutup">✕</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Konfirmasi', message, confirmText = 'Hapus', tone = 'danger' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={() => { onConfirm?.(); onClose?.() }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
    </Modal>
  )
}
