import { useMemo, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { JENJANG_OPTIONS, STATUS_NEGERI_SWASTA, STATUS_PILOTING } from '../lib/constants.js'
import { downloadCSV, formatDate, searchMatch, statusMadrasahByPct, STATUS_MADRASAH_TONES, uid } from '../lib/utils.js'
import { printPrintArea } from '../lib/printHelper.js'
import { rataRataMadrasah } from '../lib/scoring.js'
import { downloadMadrasahTemplate, parseMadrasahImport } from '../lib/excelMadrasah.js'

const EMPTY = {
  nama: '', nsm: '', npsn: '', jenjang: 'MI', statusNS: 'Negeri',
  kecamatan: '', kepala: '', hp: '', email: '', pengawasId: '',
  tahunPelajaran: '', statusPiloting: 'Aktif', catatan: ''
}

export default function MadrasahPage() {
  const { state, addOrUpdate, remove } = useData()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [filterJenjang, setFilterJenjang] = useState('')
  const [filterKec, setFilterKec] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [print, setPrint] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // { rows, errors }
  const [importing, setImporting] = useState(false)
  const fileImportRef = useRef(null)

  const data = useMemo(() => {
    return scope.madrasah
      .filter((m) => searchMatch(`${m.nama} ${m.nsm} ${m.npsn} ${m.kepala}`, search))
      .filter((m) => !filterJenjang || m.jenjang === filterJenjang)
      .filter((m) => !filterKec || m.kecamatan === filterKec)
      .map((m) => {
        const list = state.pendampingan.filter((p) => p.madrasahId === m.id)
        const ringkas = rataRataMadrasah(list, state.instrumen)
        const pengawas = state.pengawas.find((p) => p.id === m.pengawasId)?.nama ?? '-'
        return { ...m, capaian: ringkas.pct, statusKBC: statusMadrasahByPct(ringkas.pct, list.length > 0), pengawas }
      })
  }, [scope.madrasah, search, filterJenjang, filterKec, state.pendampingan, state.pengawas, state.instrumen])

  const kecamatanOpts = useMemo(() => Array.from(new Set(state.madrasah.map((m) => m.kecamatan).filter(Boolean))), [state.madrasah])

  const onSave = async (form) => {
    if (!form.nama) {
      toast.error('Nama madrasah wajib diisi')
      return
    }
    try {
      await addOrUpdate('madrasah', form)
      toast.success(form.id ? 'Data madrasah diperbarui' : 'Madrasah baru ditambahkan')
      setEditing(null)
    } catch (err) {
      toast.error('Gagal simpan: ' + (err?.message || 'unknown'))
    }
  }

  const onRemove = (item) => {
    remove('madrasah', item.id)
    toast.success(`${item.nama} dihapus`)
  }

  const exportCSV = () => {
    const rows = data.map((m) => ({
      Nama: m.nama,
      NSM: m.nsm,
      NPSN: m.npsn,
      Jenjang: m.jenjang,
      Status: m.statusNS,
      Kecamatan: m.kecamatan,
      'Kepala Madrasah': m.kepala,
      HP: m.hp,
      Email: m.email,
      Pengawas: m.pengawas,
      'Tahun Pelajaran': m.tahunPelajaran,
      'Status Piloting': m.statusPiloting,
      Capaian: `${m.capaian.toFixed(1)}%`,
      'Status KBC': m.statusKBC
    }))
    downloadCSV(`madrasah-piloting-${Date.now()}.csv`, rows)
    toast.success('Data CSV diunduh')
  }

  const onTemplate = async () => {
    try {
      await downloadMadrasahTemplate({ pengawasList: state.pengawas, tahunPelajaran: state.settings.tahunPelajaran })
      toast.success('Templat Excel diunduh')
    } catch (err) {
      toast.error('Gagal membuat templat: ' + err.message)
    }
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await parseMadrasahImport(file)
      setImportPreview(result)
    } catch (err) {
      toast.error('Gagal membaca file: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  const confirmImport = async () => {
    if (!importPreview?.rows?.length) return
    setImporting(true)
    let created = 0
    let updated = 0
    try {
      for (const row of importPreview.rows) {
        // Cari existing by NSM atau Nama+Jenjang
        const existing =
          (row.nsm && state.madrasah.find((m) => m.nsm && m.nsm === row.nsm)) ||
          state.madrasah.find((m) => m.nama.toLowerCase() === row.nama.toLowerCase() && m.jenjang === row.jenjang)

        // Resolve pengawas by name
        let pengawasId = ''
        if (row.pengawas) {
          const p = state.pengawas.find((x) => x.nama.toLowerCase() === row.pengawas.toLowerCase())
          pengawasId = p?.id || ''
        }

        const payload = {
          id: existing?.id,
          nama: row.nama,
          nsm: row.nsm,
          npsn: row.npsn,
          jenjang: row.jenjang,
          statusNS: row.statusNS,
          kecamatan: row.kecamatan,
          kepala: row.kepala,
          hp: row.hp,
          email: row.email,
          pengawasId,
          tahunPelajaran: row.tahunPelajaran || state.settings.tahunPelajaran,
          statusPiloting: row.statusPiloting,
          catatan: row.catatan
        }
        await addOrUpdate('madrasah', payload)
        if (existing) updated += 1
        else created += 1
      }
      toast.success(`Import selesai: ${created} ditambah, ${updated} diperbarui`)
      setImportPreview(null)
    } catch (err) {
      toast.error('Gagal import: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Data Madrasah Piloting"
        description="Kelola data madrasah piloting implementasi Kurikulum Berbasis Cinta."
        icon="🏫"
        compact
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={onTemplate}>📄 Templat</button>
            {scope.canEditFull && (
              <>
                <input
                  ref={fileImportRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={onImportFile}
                />
                <button className="btn-toska btn-sm" onClick={() => fileImportRef.current?.click()}>📥 Import</button>
              </>
            )}
            <button className="btn-ghost btn-sm" onClick={() => setPrint(true)}>🖨 Cetak</button>
            <button className="btn-ghost btn-sm" onClick={exportCSV}>⬇ CSV</button>
            {scope.canEditFull && (
              <button className="btn-primary btn-sm" onClick={() => setEditing({ ...EMPTY, tahunPelajaran: state.settings.tahunPelajaran })}>
                ＋ Tambah
              </button>
            )}
          </>
        }
      />

      <div className="card-pad mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Cari</label>
            <input className="input" placeholder="Cari nama / NSM / NPSN / kepala…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label">Jenjang</label>
            <select className="input" value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)}>
              <option value="">Semua jenjang</option>
              {JENJANG_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Kecamatan</label>
            <select className="input" value={filterKec} onChange={(e) => setFilterKec(e.target.value)}>
              <option value="">Semua kecamatan</option>
              {kecamatanOpts.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.length ? (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Nama Madrasah</th>
                  <th>NSM / NPSN</th>
                  <th>Jenjang</th>
                  <th>Kecamatan</th>
                  <th>Kepala</th>
                  <th>Pengawas</th>
                  <th>Capaian KBC</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <p className="font-medium text-navy-900">{m.nama}</p>
                      <p className="text-xs text-slate-500">{m.statusNS} · {m.tahunPelajaran || '-'}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs">{m.nsm}</p>
                      <p className="font-mono text-xs text-slate-500">{m.npsn}</p>
                    </td>
                    <td>{m.jenjang}</td>
                    <td>{m.kecamatan}</td>
                    <td>{m.kepala}<br /><span className="text-xs text-slate-500">{m.hp}</span></td>
                    <td>{m.pengawas}</td>
                    <td>{m.capaian.toFixed(1)}%</td>
                    <td><Badge tone={STATUS_MADRASAH_TONES[m.statusKBC]}>{m.statusKBC}</Badge></td>
                    <td className="text-right whitespace-nowrap">
                      {scope.canEditFull && (
                        <>
                          <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(m)}>✎</button>
                          <button className="btn-danger btn-sm" onClick={() => setConfirm(m)}>✕</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Belum ada madrasah" description="Tambahkan madrasah piloting untuk memulai." />
        )}
      </div>

      {editing && (
        <FormMadrasah
          key={editing.id || 'new'}
          open={!!editing}
          value={editing}
          onClose={() => setEditing(null)}
          onSave={onSave}
          pengawasList={state.pengawas}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => onRemove(confirm)}
        title="Hapus Madrasah"
        message={`Yakin menghapus ${confirm?.nama}? Data terkait pendampingan tetap tersimpan namun tidak terhubung.`}
      />

      <PrintMadrasah open={print} onClose={() => setPrint(false)} data={data} settings={state.settings} />

      <ImportPreview
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        preview={importPreview}
        onConfirm={confirmImport}
        importing={importing}
        existingMadrasah={state.madrasah}
      />
    </>
  )
}

function FormMadrasah({ open, value, onClose, onSave, pengawasList }) {
  const [form, setForm] = useState(value || EMPTY)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={value?.id ? 'Edit Madrasah' : 'Tambah Madrasah'}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" form="form-madrasah" type="submit">Simpan</button>
        </>
      }
    >
      <form id="form-madrasah" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nama Madrasah" required><input className="input" value={form.nama} onChange={(e) => upd('nama', e.target.value)} required /></Field>
        <Field label="Jenjang"><select className="input" value={form.jenjang} onChange={(e) => upd('jenjang', e.target.value)}>{JENJANG_OPTIONS.map((j) => <option key={j}>{j}</option>)}</select></Field>
        <Field label="NSM"><input className="input" value={form.nsm} onChange={(e) => upd('nsm', e.target.value)} /></Field>
        <Field label="NPSN"><input className="input" value={form.npsn} onChange={(e) => upd('npsn', e.target.value)} /></Field>
        <Field label="Status"><select className="input" value={form.statusNS} onChange={(e) => upd('statusNS', e.target.value)}>{STATUS_NEGERI_SWASTA.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Kecamatan"><input className="input" value={form.kecamatan} onChange={(e) => upd('kecamatan', e.target.value)} /></Field>
        <Field label="Kepala Madrasah"><input className="input" value={form.kepala} onChange={(e) => upd('kepala', e.target.value)} /></Field>
        <Field label="Nomor HP"><input className="input" value={form.hp} onChange={(e) => upd('hp', e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} /></Field>
        <Field label="Pengawas Pendamping">
          <select className="input" value={form.pengawasId || ''} onChange={(e) => upd('pengawasId', e.target.value)}>
            <option value="">— Pilih pengawas —</option>
            {pengawasList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        </Field>
        <Field label="Tahun Pelajaran"><input className="input" placeholder="2025/2026" value={form.tahunPelajaran} onChange={(e) => upd('tahunPelajaran', e.target.value)} /></Field>
        <Field label="Status Piloting"><select className="input" value={form.statusPiloting} onChange={(e) => upd('statusPiloting', e.target.value)}>{STATUS_PILOTING.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <div className="sm:col-span-2">
          <label className="label">Catatan Awal</label>
          <textarea className="input" rows={3} value={form.catatan} onChange={(e) => upd('catatan', e.target.value)} />
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
    </div>
  )
}

function PrintMadrasah({ open, onClose, data, settings }) {
  if (!open) return null
  const handlePrint = () => {
    setPrint(true)
    setTimeout(() => printPrintArea({ title: 'Daftar Madrasah' }), 200)
  }
  return (
    <Modal open={open} onClose={onClose} title="Pratinjau Cetak — Daftar Madrasah" size="xl"
      footer={<><button className="btn-ghost" onClick={onClose}>Tutup</button><button className="btn-primary" onClick={handlePrint}>🖨 Cetak</button></>}
    >
      <div className="print-area bg-white p-6">
        <PrintHeader settings={settings} judul="DAFTAR MADRASAH PILOTING IMPLEMENTASI KBC" />
        <table className="table-clean">
          <thead><tr><th>No</th><th>Nama Madrasah</th><th>Jenjang</th><th>Status</th><th>Kecamatan</th><th>Kepala</th><th>Pengawas</th><th>Status Piloting</th></tr></thead>
          <tbody>
            {data.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td>{m.nama}<br /><span className="text-xs text-slate-500">{m.nsm} / {m.npsn}</span></td>
                <td>{m.jenjang}</td>
                <td>{m.statusNS}</td>
                <td>{m.kecamatan}</td>
                <td>{m.kepala}</td>
                <td>{m.pengawas}</td>
                <td>{m.statusPiloting}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-xs text-slate-500">Dicetak {formatDate(new Date())}.</p>
      </div>
    </Modal>
  )
}

function ImportPreview({ open, onClose, preview, onConfirm, importing, existingMadrasah }) {
  if (!open || !preview) return null
  const { rows = [], errors = [] } = preview
  const matchInfo = (row) => {
    const byNSM = row.nsm && existingMadrasah.find((m) => m.nsm === row.nsm)
    const byName = !byNSM && existingMadrasah.find((m) => m.nama.toLowerCase() === row.nama.toLowerCase() && m.jenjang === row.jenjang)
    if (byNSM) return { tone: 'gold', label: 'UPDATE (NSM)' }
    if (byName) return { tone: 'gold', label: 'UPDATE (nama+jenjang)' }
    return { tone: 'emerald', label: 'BARU' }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pratinjau Import — ${rows.length} baris valid${errors.length ? `, ${errors.length} error` : ''}`}
      size="xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={importing}>Batal</button>
          <button className="btn-primary" onClick={onConfirm} disabled={importing || !rows.length}>
            {importing ? 'Mengimpor…' : `Konfirmasi Import (${rows.length})`}
          </button>
        </>
      }
    >
      {errors.length > 0 && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <p className="font-semibold mb-1">Baris dengan error ({errors.length}) — akan dilewati:</p>
          <ul className="list-disc ml-5 space-y-0.5 text-xs">
            {errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 20 && <li>… dan {errors.length - 20} error lainnya</li>}
          </ul>
        </div>
      )}
      {rows.length ? (
        <div className="overflow-x-auto max-h-[55vh]">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Baris</th><th>Status</th><th>Nama</th><th>Jenjang</th>
                <th>NSM</th><th>Kecamatan</th><th>Kepala</th><th>Pengawas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = matchInfo(r)
                return (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td><Badge tone={m.tone}>{m.label}</Badge></td>
                    <td className="font-medium text-navy-900">{r.nama}</td>
                    <td>{r.jenjang}</td>
                    <td className="font-mono text-xs">{r.nsm}</td>
                    <td>{r.kecamatan}</td>
                    <td>{r.kepala}</td>
                    <td>{r.pengawas}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Tidak ada baris valid untuk diimpor.</p>
      )}
    </Modal>
  )
}
