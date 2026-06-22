import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Badge from '../components/Badge.jsx'
import PrintHeader, { PrintSignature } from '../components/PrintHeader.jsx'
import TrialBanner from '../components/TrialBanner.jsx'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { printPrintArea } from '../lib/printHelper.js'
import {
  TAHAPAN_PEMBIASAAN, TOTAL_KEGIATAN_HARIAN, getKategoriPembiasaan,
  BULAN_NAMA, getDaysInMonth
} from '../lib/instrumenKBC.js'

const STORAGE_KEY = 'kbc_jurnal_pembiasaan_v1'

function loadJurnal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function saveJurnal(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

const today = new Date()
const emptyChecklist = () => {
  const c = {}
  TAHAPAN_PEMBIASAAN.forEach((t) => { c[t.id] = {}; t.kegiatan.forEach((_, k) => { c[t.id][k] = {} }) })
  return c
}

export default function JurnalPembiasaanPage() {
  const { state } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const [jurnal, setJurnal] = useState(loadJurnal)
  const [editing, setEditing] = useState(null) // jurnal yg sedang diedit
  const [view, setView] = useState(null) // jurnal yg sedang dilihat (cetak)
  const [filterMadrasah, setFilterMadrasah] = useState('')
  const [filterBulan, setFilterBulan] = useState(today.getMonth() + 1)
  const [filterTahun, setFilterTahun] = useState(today.getFullYear())

  useEffect(() => { saveJurnal(jurnal) }, [jurnal])

  const filtered = useMemo(() => {
    return jurnal.filter((j) => {
      if (filterMadrasah && j.madrasahId !== filterMadrasah) return false
      if (Number(filterBulan) && j.bulan !== Number(filterBulan)) return false
      if (Number(filterTahun) && j.tahun !== Number(filterTahun)) return false
      return true
    }).sort((a, b) => (b.tahun - a.tahun) || (b.bulan - a.bulan))
  }, [jurnal, filterMadrasah, filterBulan, filterTahun])

  const newJurnal = () => {
    const m = state.madrasah[0]
    setEditing({
      id: `pb-${Date.now()}`,
      madrasahId: m?.id || '', madrasahNama: m?.nama || '',
      guruNama: '',
      kelas: '',
      bulan: today.getMonth() + 1, tahun: today.getFullYear(),
      semester: today.getMonth() + 1 >= 7 ? 'Ganjil' : 'Genap',
      checklist: emptyChecklist(),
      catatanRefleksi: '',
      status: 'Draft',
      createdAt: new Date().toISOString()
    })
  }

  const saveEdit = () => {
    if (!editing.madrasahId) { toast.error('Pilih madrasah dulu'); return }
    if (!editing.guruNama) { toast.error('Isi nama guru'); return }
    setJurnal((prev) => {
      const idx = prev.findIndex((p) => p.id === editing.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = editing; return next }
      return [editing, ...prev]
    })
    toast.success('Jurnal pembiasaan tersimpan')
    setEditing(null)
  }

  const deleteJurnal = (id) => {
    if (!confirm('Hapus jurnal ini?')) return
    setJurnal((prev) => prev.filter((p) => p.id !== id))
    toast.success('Jurnal dihapus')
  }

  return (
    <>
      <TrialBanner />
      <PageHeader
        title="Jurnal Pembiasaan Harian"
        description="Jurnal Pembiasaan Harian Guru Berbasis Cinta — 7 tahapan, checklist per tanggal"
        actions={
          <button className="btn-primary" onClick={newJurnal}>+ Buat Jurnal</button>
        }
      />

      {/* Filter */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="label">Madrasah</label>
          <select className="input" value={filterMadrasah} onChange={(e) => setFilterMadrasah(e.target.value)}>
            <option value="">Semua madrasah</option>
            {state.madrasah.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Bulan</label>
          <select className="input" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
            <option value="">Semua bulan</option>
            {BULAN_NAMA.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tahun</label>
          <input type="number" className="input" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📔"
          title="Belum ada jurnal"
          description="Klik 'Buat Jurnal' untuk membuat jurnal pembiasaan harian guru."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((j) => {
            const total = computeTotal(j)
            const k = getKategoriPembiasaan(total.pct)
            return (
              <div key={j.id} className="card hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-serif font-semibold text-navy-900">{j.guruNama}</p>
                    <p className="text-xs text-slate-500">{j.madrasahNama} · {j.kelas || '-'}</p>
                  </div>
                  <Badge tone={k.tone}>{k.label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-3">
                  <div><span className="text-slate-400">Bulan</span><br /><span className="font-medium">{BULAN_NAMA[j.bulan - 1]} {j.tahun}</span></div>
                  <div><span className="text-slate-400">Capaian</span><br /><span className="font-medium">{total.pct.toFixed(1)}%</span></div>
                  <div><span className="text-slate-400">Status</span><br /><span className="font-medium">{j.status}</span></div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline text-xs flex-1" onClick={() => setView(j)}>👁 Lihat / Cetak</button>
                  <button className="btn-outline text-xs flex-1" onClick={() => setEditing(j)}>✏ Edit</button>
                  <button className="btn-outline text-xs text-rose-600 border-rose-200" onClick={() => deleteJurnal(j.id)}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form edit */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id.startsWith('pb-') ? 'Buat Jurnal Pembiasaan' : 'Edit Jurnal Pembiasaan'} wide>
          <FormJurnal
            data={editing}
            onChange={setEditing}
            madrasah={state.madrasah}
            onSave={saveEdit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* View / Print */}
      {view && (
        <Modal onClose={() => setView(null)} title="Detail Jurnal Pembiasaan" wide printable>
          <CetakJurnal jurnal={view} settings={state.settings} />
          <div className="flex justify-end gap-2 mt-4 no-print">
            <button className="btn-outline" onClick={() => setView(null)}>Tutup</button>
            <button className="btn-primary" onClick={() => printPrintArea({ title: 'Jurnal Pembiasaan' })}>🖨 Cetak</button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ---------- helpers ----------
function computeTotal(j) {
  const days = getDaysInMonth(j.tahun, j.bulan)
  let checked = 0
  let totalCells = 0
  TAHAPAN_PEMBIASAAN.forEach((t) => {
    t.kegiatan.forEach((_, k) => {
      for (let d = 1; d <= days; d++) {
        totalCells++
        if (j.checklist?.[t.id]?.[k]?.[d]) checked++
      }
    })
  })
  return { checked, totalCells, pct: totalCells ? (checked / totalCells) * 100 : 0 }
}

// ---------- Form ----------
function FormJurnal({ data, onChange, madrasah, onSave, onCancel }) {
  const days = getDaysInMonth(data.tahun, data.bulan)
  const [activeTahapan, setActiveTahapan] = useState(TAHAPAN_PEMBIASAAN[0].id)

  const updateField = (k, v) => onChange({ ...data, [k]: v })

  const setMadrasah = (id) => {
    const m = madrasah.find((mm) => mm.id === id)
    onChange({ ...data, madrasahId: id, madrasahNama: m?.nama || '' })
  }

  const toggleCell = (tahapanId, kIdx, day) => {
    const cl = JSON.parse(JSON.stringify(data.checklist || {}))
    cl[tahapanId] = cl[tahapanId] || {}
    cl[tahapanId][kIdx] = cl[tahapanId][kIdx] || {}
    cl[tahapanId][kIdx][day] = !cl[tahapanId][kIdx][day]
    onChange({ ...data, checklist: cl })
  }

  const total = computeTotal(data)
  const k = getKategoriPembiasaan(total.pct)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Madrasah</label>
          <select className="input" value={data.madrasahId} onChange={(e) => setMadrasah(e.target.value)}>
            <option value="">Pilih madrasah</option>
            {madrasah.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nama Guru</label>
          <input className="input" value={data.guruNama} onChange={(e) => updateField('guruNama', e.target.value)} />
        </div>
        <div>
          <label className="label">Kelas</label>
          <input className="input" value={data.kelas} onChange={(e) => updateField('kelas', e.target.value)} placeholder="Misal: 5A" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Bulan</label>
          <select className="input" value={data.bulan} onChange={(e) => updateField('bulan', Number(e.target.value))}>
            {BULAN_NAMA.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tahun</label>
          <input type="number" className="input" value={data.tahun} onChange={(e) => updateField('tahun', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={data.status} onChange={(e) => updateField('status', e.target.value)}>
            <option>Draft</option>
            <option>Dikirim</option>
            <option>Disetujui</option>
            <option>Perlu Revisi</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-toska-50 border border-toska-200 px-4 py-2 flex items-center justify-between text-sm">
        <span>Capaian: <strong>{total.pct.toFixed(1)}%</strong> ({total.checked}/{total.totalCells} cell)</span>
        <Badge tone={k.tone}>{k.label}</Badge>
      </div>

      {/* Tabs tahapan */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200">
        {TAHAPAN_PEMBIASAAN.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`px-3 py-1.5 text-xs rounded-t-lg whitespace-nowrap transition ${
              activeTahapan === t.id ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTahapan(t.id)}
          >
            {t.no}. {t.nama.split('/')[0].trim()}
          </button>
        ))}
      </div>

      {/* Tabel checklist tahapan aktif */}
      {TAHAPAN_PEMBIASAAN.filter((t) => t.id === activeTahapan).map((t) => (
        <div key={t.id}>
          <p className="text-xs text-slate-600 italic mb-2">{t.tujuan}</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="text-xs w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-1 text-left sticky left-0 bg-slate-100" style={{ minWidth: 280 }}>Kegiatan</th>
                  {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                    <th key={d} className="px-1 py-1 text-center" style={{ width: 28 }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.kegiatan.map((teks, kIdx) => (
                  <tr key={kIdx} className="border-t">
                    <td className="px-2 py-1 sticky left-0 bg-white text-slate-700">{kIdx + 1}. {teks}</td>
                    {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                      const checked = !!data.checklist?.[t.id]?.[kIdx]?.[d]
                      return (
                        <td key={d} className="text-center">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded border ${checked ? 'bg-toska-600 border-toska-700 text-white' : 'bg-white border-slate-300'}`}
                            onClick={() => toggleCell(t.id, kIdx, d)}
                          >
                            {checked ? '✓' : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div>
        <label className="label">Catatan / Refleksi Guru</label>
        <textarea className="input" rows={3} value={data.catatanRefleksi || ''} onChange={(e) => updateField('catatanRefleksi', e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button className="btn-outline" onClick={onCancel}>Batal</button>
        <button className="btn-primary" onClick={onSave}>💾 Simpan</button>
      </div>
    </div>
  )
}

// ---------- Cetak ----------
function CetakJurnal({ jurnal, settings }) {
  const days = getDaysInMonth(jurnal.tahun, jurnal.bulan)
  const total = computeTotal(jurnal)
  const k = getKategoriPembiasaan(total.pct)
  return (
    <div className="print-area bg-white p-6">
      <PrintHeader settings={settings} judul="JURNAL PEMBIASAAN HARIAN GURU BERBASIS CINTA" />
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div><strong>Madrasah:</strong> {jurnal.madrasahNama}</div>
        <div><strong>Bulan / Tahun:</strong> {BULAN_NAMA[jurnal.bulan - 1]} {jurnal.tahun}</div>
        <div><strong>Guru:</strong> {jurnal.guruNama}</div>
        <div><strong>Kelas:</strong> {jurnal.kelas || '-'}</div>
        <div><strong>Semester:</strong> {jurnal.semester}</div>
        <div><strong>Capaian:</strong> {total.pct.toFixed(1)}% — {k.label}</div>
      </div>

      {TAHAPAN_PEMBIASAAN.map((t) => (
        <div key={t.id} className="mb-4">
          <p className="font-semibold text-navy-900 text-sm mb-1">{t.no}. {t.nama}</p>
          <p className="text-xs italic text-slate-600 mb-1">{t.tujuan}</p>
          <table className="text-[9pt] w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-1 py-1 text-left" style={{ minWidth: 200 }}>Kegiatan</th>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                  <th key={d} className="text-center" style={{ width: 16 }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.kegiatan.map((teks, kIdx) => (
                <tr key={kIdx}>
                  <td className="px-1 py-0.5">{kIdx + 1}. {teks}</td>
                  {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                    <td key={d} className="text-center">{jurnal.checklist?.[t.id]?.[kIdx]?.[d] ? '✓' : ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {jurnal.catatanRefleksi && (
        <div className="mt-4">
          <p className="font-semibold text-sm">Catatan / Refleksi Guru:</p>
          <p className="text-sm">{jurnal.catatanRefleksi}</p>
        </div>
      )}

      <PrintSignature settings={settings} namaPengawas={jurnal.guruNama} />
    </div>
  )
}

// ---------- Modal ----------
function Modal({ children, title, onClose, wide, printable }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-950/60 flex items-start justify-center overflow-y-auto py-8 px-4 no-print">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-6xl' : 'max-w-2xl'} ${printable ? 'p-0' : 'p-6'}`}>
        {!printable && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-navy-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>
        )}
        {printable ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="font-serif font-semibold text-navy-900">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            {children}
          </div>
        ) : children}
      </div>
    </div>
  )
}
