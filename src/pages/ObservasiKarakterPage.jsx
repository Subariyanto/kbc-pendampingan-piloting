import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Badge from '../components/Badge.jsx'
import PrintHeader, { PrintSignature } from '../components/PrintHeader.jsx'
import TrialBanner from '../components/TrialBanner.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { printPrintArea } from '../lib/printHelper.js'
import {
  INSTRUMEN_KARAKTER, TOTAL_INDIKATOR_KARAKTER, SKOR_MAX_KARAKTER,
  SKOR_KARAKTER_LABEL, getKategoriKarakter, getRekomendasiKarakter, BULAN_NAMA
} from '../lib/instrumenKBC.js'

const STORAGE_KEY = 'kbc_observasi_karakter_v1'

function loadObs() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] } }
function saveObs(list) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {} }

const today = new Date()

export default function ObservasiKarakterPage() {
  const { state } = useData()
  const toast = useToast()
  const [list, setList] = useState(loadObs)
  const [editing, setEditing] = useState(null)
  const [view, setView] = useState(null)
  const [filterMadrasah, setFilterMadrasah] = useState('')
  const [filterKelas, setFilterKelas] = useState('')

  useEffect(() => { saveObs(list) }, [list])

  const filtered = useMemo(() => {
    return list.filter((o) => {
      if (filterMadrasah && o.madrasahId !== filterMadrasah) return false
      if (filterKelas && o.kelas !== filterKelas) return false
      return true
    }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
  }, [list, filterMadrasah, filterKelas])

  const kelasOptions = useMemo(() => Array.from(new Set(list.map((o) => o.kelas).filter(Boolean))), [list])

  const newObs = () => {
    const m = state.madrasah[0]
    const skor = {}
    INSTRUMEN_KARAKTER.aspek.forEach((a) => a.indikator.forEach((i) => { skor[i.no] = 0 }))
    setEditing({
      id: `ok-${Date.now()}`,
      madrasahId: m?.id || '', madrasahNama: m?.nama || '',
      muridNama: '', nisn: '', kelas: '',
      guruNama: '',
      tanggal: today.toISOString().slice(0, 10),
      bulan: today.getMonth() + 1,
      skor,
      catatan: '',
      tindakLanjut: '',
      status: 'Draft',
      createdAt: new Date().toISOString()
    })
  }

  const saveEdit = () => {
    if (!editing.muridNama) { toast.error('Isi nama murid'); return }
    if (!editing.madrasahId) { toast.error('Pilih madrasah'); return }
    setList((prev) => {
      const idx = prev.findIndex((p) => p.id === editing.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = editing; return next }
      return [editing, ...prev]
    })
    toast.success('Observasi tersimpan')
    setEditing(null)
  }

  const deleteObs = (id) => {
    if (!confirm('Hapus observasi ini?')) return
    setList((prev) => prev.filter((p) => p.id !== id))
    toast.success('Observasi dihapus')
  }

  return (
    <>
      <TrialBanner />
      <PageHeader
        title="Observasi Karakter Murid"
        description={`Instrumen: ${INSTRUMEN_KARAKTER.judul} (${TOTAL_INDIKATOR_KARAKTER} indikator)`}
        actions={<button className="btn-primary" onClick={newObs}>+ Buat Observasi</button>}
      />

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Madrasah</label>
          <select className="input" value={filterMadrasah} onChange={(e) => setFilterMadrasah(e.target.value)}>
            <option value="">Semua madrasah</option>
            {state.madrasah.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Kelas</label>
          <select className="input" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua kelas</option>
            {kelasOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🧒"
          title="Belum ada observasi"
          description="Klik 'Buat Observasi' untuk mengisi instrumen karakter murid."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((o) => {
            const total = computeTotal(o)
            const k = getKategoriKarakter(total.nilai)
            return (
              <div key={o.id} className="card hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-serif font-semibold text-navy-900">{o.muridNama}</p>
                    <p className="text-xs text-slate-500">{o.kelas || '-'} · {o.madrasahNama}</p>
                  </div>
                  <Badge tone={k.tone}>{k.label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-3">
                  <div><span className="text-slate-400">Tanggal</span><br /><span className="font-medium">{o.tanggal}</span></div>
                  <div><span className="text-slate-400">Nilai</span><br /><span className="font-medium">{total.nilai.toFixed(1)}</span></div>
                  <div><span className="text-slate-400">Status</span><br /><span className="font-medium">{o.status}</span></div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline text-xs flex-1" onClick={() => setView(o)}>👁 Lihat</button>
                  <button className="btn-outline text-xs flex-1" onClick={() => setEditing(o)}>✏ Edit</button>
                  <button className="btn-outline text-xs text-rose-600 border-rose-200" onClick={() => deleteObs(o.id)}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Form Observasi Karakter Murid" wide>
          <FormObservasi data={editing} onChange={setEditing} madrasah={state.madrasah} onSave={saveEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {view && (
        <Modal onClose={() => setView(null)} title="Detail Observasi Karakter" wide printable>
          <CetakObservasi obs={view} settings={state.settings} />
          <div className="flex justify-end gap-2 mt-4 no-print">
            <button className="btn-outline" onClick={() => setView(null)}>Tutup</button>
            <button className="btn-primary" onClick={() => printPrintArea({ title: 'Observasi Karakter' })}>🖨 Cetak</button>
          </div>
        </Modal>
      )}
    </>
  )
}

function computeTotal(o) {
  const skor = o.skor || {}
  const sum = Object.values(skor).reduce((s, v) => s + (Number(v) || 0), 0)
  const nilai = SKOR_MAX_KARAKTER ? (sum / SKOR_MAX_KARAKTER) * 100 : 0
  return { sum, nilai }
}

function FormObservasi({ data, onChange, madrasah, onSave, onCancel }) {
  const updateField = (k, v) => onChange({ ...data, [k]: v })
  const setSkor = (no, val) => onChange({ ...data, skor: { ...data.skor, [no]: Number(val) || 0 } })
  const setMadrasah = (id) => {
    const m = madrasah.find((mm) => mm.id === id)
    onChange({ ...data, madrasahId: id, madrasahNama: m?.nama || '' })
  }
  const total = computeTotal(data)
  const k = getKategoriKarakter(total.nilai)

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
          <label className="label">Nama Murid</label>
          <input className="input" value={data.muridNama} onChange={(e) => updateField('muridNama', e.target.value)} />
        </div>
        <div>
          <label className="label">NISN</label>
          <input className="input" value={data.nisn} onChange={(e) => updateField('nisn', e.target.value)} />
        </div>
        <div>
          <label className="label">Kelas</label>
          <input className="input" value={data.kelas} onChange={(e) => updateField('kelas', e.target.value)} />
        </div>
        <div>
          <label className="label">Guru / Observer</label>
          <input className="input" value={data.guruNama} onChange={(e) => updateField('guruNama', e.target.value)} />
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={data.tanggal} onChange={(e) => updateField('tanggal', e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg bg-toska-50 border border-toska-200 px-4 py-2 flex items-center justify-between text-sm">
        <span>Nilai akhir: <strong>{total.nilai.toFixed(1)}</strong> ({total.sum}/{SKOR_MAX_KARAKTER})</span>
        <Badge tone={k.tone}>{k.label}</Badge>
      </div>

      <p className="text-xs text-slate-500 italic">
        Skor: 1 = Mulai Bertumbuh, 2 = Sedang Belajar, 3 = Berkembang Baik, 4 = Sudah Terbiasa
      </p>

      {INSTRUMEN_KARAKTER.aspek.map((a) => (
        <div key={a.id} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
            <p className="font-semibold text-navy-900 text-sm">{a.kode}. {a.nama}</p>
          </div>
          <table className="text-sm w-full">
            <thead className="bg-slate-50/50 text-xs">
              <tr>
                <th className="px-2 py-1 text-left">Indikator</th>
                <th className="px-2 py-1 w-32 text-center">Skor</th>
              </tr>
            </thead>
            <tbody>
              {a.indikator.map((i) => (
                <tr key={i.no} className="border-t">
                  <td className="px-2 py-1">{i.no}. {i.teks}</td>
                  <td className="px-2 py-1">
                    <select className="input py-1 text-xs" value={data.skor?.[i.no] || 0} onChange={(e) => setSkor(i.no, e.target.value)}>
                      <option value={0}>—</option>
                      <option value={1}>1 — Mulai Bertumbuh</option>
                      <option value={2}>2 — Sedang Belajar</option>
                      <option value={3}>3 — Berkembang Baik</option>
                      <option value={4}>4 — Sudah Terbiasa</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div>
        <label className="label">Catatan Observasi</label>
        <textarea className="input" rows={3} value={data.catatan || ''} onChange={(e) => updateField('catatan', e.target.value)} />
      </div>

      <div>
        <label className="label">Tindak Lanjut</label>
        <textarea className="input" rows={2} value={data.tindakLanjut || ''} onChange={(e) => updateField('tindakLanjut', e.target.value)} />
      </div>

      <div>
        <label className="label">Status</label>
        <select className="input" value={data.status} onChange={(e) => updateField('status', e.target.value)}>
          <option>Draft</option>
          <option>Dikirim</option>
          <option>Disetujui</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button className="btn-outline" onClick={onCancel}>Batal</button>
        <button className="btn-primary" onClick={onSave}>💾 Simpan</button>
      </div>
    </div>
  )
}

function CetakObservasi({ obs, settings }) {
  const total = computeTotal(obs)
  const k = getKategoriKarakter(total.nilai)
  return (
    <div className="print-area bg-white p-6">
      <PrintHeader settings={settings} judul="OBSERVASI KARAKTER MURID" />
      <p className="text-center text-sm font-semibold text-navy-900 mb-4">{INSTRUMEN_KARAKTER.judul}</p>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div><strong>Nama Murid:</strong> {obs.muridNama}</div>
        <div><strong>NISN:</strong> {obs.nisn || '-'}</div>
        <div><strong>Kelas:</strong> {obs.kelas || '-'}</div>
        <div><strong>Madrasah:</strong> {obs.madrasahNama}</div>
        <div><strong>Tanggal:</strong> {obs.tanggal}</div>
        <div><strong>Observer / Guru:</strong> {obs.guruNama || '-'}</div>
      </div>

      {INSTRUMEN_KARAKTER.aspek.map((a) => (
        <div key={a.id} className="mb-3">
          <p className="font-semibold text-navy-900 text-sm">{a.kode}. {a.nama}</p>
          <table className="text-sm w-full">
            <thead className="bg-slate-100">
              <tr><th className="px-2 py-1 text-left">No</th><th className="px-2 py-1 text-left">Indikator</th><th className="px-2 py-1 text-center w-20">Skor</th></tr>
            </thead>
            <tbody>
              {a.indikator.map((i) => (
                <tr key={i.no}>
                  <td className="px-2 py-1">{i.no}</td>
                  <td className="px-2 py-1">{i.teks}</td>
                  <td className="px-2 py-1 text-center">{obs.skor?.[i.no] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div><strong>Total Skor:</strong> {total.sum} / {SKOR_MAX_KARAKTER}</div>
        <div><strong>Nilai Akhir:</strong> {total.nilai.toFixed(1)} ({k.label})</div>
      </div>

      <div className="mt-3 text-sm">
        <p className="font-semibold">Rekomendasi:</p>
        <p>{getRekomendasiKarakter(k.label)}</p>
      </div>

      {obs.catatan && (
        <div className="mt-3 text-sm"><p className="font-semibold">Catatan Observasi:</p><p>{obs.catatan}</p></div>
      )}
      {obs.tindakLanjut && (
        <div className="mt-3 text-sm"><p className="font-semibold">Tindak Lanjut:</p><p>{obs.tindakLanjut}</p></div>
      )}

      <PrintSignature settings={settings} namaPengawas={obs.guruNama || '____________________'} />
    </div>
  )
}

function Modal({ children, title, onClose, wide, printable }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-950/60 flex items-start justify-center overflow-y-auto py-8 px-4 no-print">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} ${printable ? 'p-0' : 'p-6'}`}>
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
