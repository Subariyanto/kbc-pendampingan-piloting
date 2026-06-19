// Utility helpers shared across the app

export const STORAGE_KEY = 'kbc_pendampingan_v1'

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

export function formatDateLong(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return value
  }
}

export function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export function clampPct(v) {
  if (Number.isNaN(v) || !Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Number(v)))
}

export function kategoriKBC(pct) {
  const p = clampPct(pct)
  if (p >= 86) return { label: 'Sangat Baik', tone: 'emerald' }
  if (p >= 71) return { label: 'Baik', tone: 'toska' }
  if (p >= 51) return { label: 'Mulai Berkembang', tone: 'gold' }
  return { label: 'Perlu Pembinaan Intensif', tone: 'rose' }
}

export function statusMadrasahByPct(pct, hasPendampingan) {
  if (!hasPendampingan) return 'Belum Didampingi'
  const p = clampPct(pct)
  if (p >= 86) return 'Sangat Baik'
  if (p >= 71) return 'Baik'
  if (p >= 51) return 'Proses'
  return 'Perlu Tindak Lanjut'
}

export const STATUS_MADRASAH_TONES = {
  'Belum Didampingi': 'slate',
  Proses: 'gold',
  'Perlu Tindak Lanjut': 'rose',
  Baik: 'toska',
  'Sangat Baik': 'emerald'
}

export const STATUS_JADWAL_TONES = {
  Terjadwal: 'toska',
  Terlaksana: 'emerald',
  Ditunda: 'gold',
  Selesai: 'navy'
}

export const STATUS_TINDAK_LANJUT_TONES = {
  'Belum Dikerjakan': 'slate',
  Proses: 'gold',
  Selesai: 'emerald',
  'Perlu Pendampingan Ulang': 'rose'
}

export function downloadCSV(filename, rows) {
  if (!rows?.length) return
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v).replace(/"/g, '""')
    return /[",\n;]/.test(s) ? `"${s}"` : s
  }
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => escape(r[h])).join(';'))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (e) {
        reject(e)
      }
    }
    reader.readAsText(file)
  })
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

export function searchMatch(text, query) {
  if (!query) return true
  return String(text || '').toLowerCase().includes(String(query).toLowerCase())
}

export function monthLabel(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function monthKey(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function isOverdue(dueDate, status) {
  if (!dueDate) return false
  if (status === 'Selesai') return false
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}
