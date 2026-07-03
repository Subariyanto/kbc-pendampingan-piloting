import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader from '../components/PrintHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { resolvePengawasFromUser } from '../lib/pengawasResolver.js'
import { STATUS_TINDAK_LANJUT, SKOR_LABELS, BENTUK_KEGIATAN, MATERI_DEFAULTS } from '../lib/constants.js'
import { formatDate, formatDateLong, searchMatch, STATUS_TINDAK_LANJUT_TONES, todayISO, kategoriKBC } from '../lib/utils.js'
import { summarizeSkor } from '../lib/scoring.js'
import { generateDraftPendampingan, generateFieldDraft } from '../lib/draftPendampingan.js'
import { printPrintArea } from '../lib/printHelper.js'

const EMPTY = {
  tanggal: todayISO(), madrasahId: '', pengawasId: '', bentuk: '',
  kegiatan: '', temuanPositif: '', kendala: '', observasi: '', rekomendasi: '',
  rencanaTindakLanjut: '', batasTL: '', statusTL: 'Belum Dikerjakan',
  buktiLink: '', skor: {}, keterangan: {}
}

export default function PendampinganPage() {
  const { state, addOrUpdate, remove } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [printItem, setPrintItem] = useState(null)
  const [printMode, setPrintMode] = useState('laporan') // 'laporan' | 'berita-acara'

  const data = useMemo(() => {
    return scope.pendampingan
      .filter((p) => searchMatch(`${p.kegiatan} ${p.rekomendasi}`, search))
      .map((p) => ({
        ...p,
        madrasah: state.madrasah.find((m) => m.id === p.madrasahId)?.nama ?? '-',
        pengawas: state.pengawas.find((g) => g.id === p.pengawasId)?.nama ?? '-',
        ringkas: summarizeSkor(p.skor, state.instrumen)
      }))
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  }, [scope.pendampingan, search, state.madrasah, state.pengawas, state.instrumen])

  const onSave = (form) => {
    // Auto-fill pengawasId from logged-in user if empty
    if (!form.pengawasId && user) {
      const matched = resolvePengawasFromUser(user, state.pengawas)
      if (matched?.id) form.pengawasId = matched.id
    }
    // Auto-fill namaLengkap from pengawas data
    if (!form.namaLengkap) {
      const pw = state.pengawas.find((p) => p.id === form.pengawasId) || resolvePengawasFromUser(user, state.pengawas)
      if (pw?.namaLengkap) form.namaLengkap = pw.namaLengkap
    }
    if (!form.madrasahId || !form.pengawasId || !form.kegiatan) {
      toast.error('Madrasah, pengawas, dan kegiatan wajib diisi')
      return
    }
    addOrUpdate('pendampingan', form)
    toast.success(form.id ? 'Hasil pendampingan diperbarui' : 'Hasil pendampingan ditambahkan')
    setEditing(null)
  }

  const handlePrint = (item, mode) => {
    setPrintItem(item)
    setPrintMode(mode)
  }

  return (
    <>
      <PageHeader
        title="Hasil Pendampingan"
        description="Catatan hasil pendampingan, observasi, skor instrumen, dan rekomendasi tindak lanjut."
        icon="📝"
        actions={
          scope.canEdit ? (
            <button className="btn-primary" onClick={() => setEditing({ ...EMPTY, pengawasId: scope.pengawasIds[0] || '' })}>
              ＋ Tambah Hasil Pendampingan
            </button>
          ) : null
        }
      />

      <div className="card-pad mb-4">
        <input className="input" placeholder="Cari kegiatan / rekomendasi…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {data.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th className="text-left">Nama Madrasah</th>
                  <th className="text-center w-24">Capaian</th>
                  <th className="text-center w-32">Predikat</th>
                  <th className="text-center w-28">Laporan</th>
                  <th className="text-center w-24">BA</th>
                  {scope.canEdit && <th className="text-center w-20">Edit</th>}
                  {scope.canEdit && <th className="text-center w-20">Hapus</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const kat = p.ringkas.kategori
                  return (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium text-navy-900">{p.madrasah}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(p.tanggal)} · {p.kegiatan}</p>
                      </td>
                      <td className="text-center">
                        <span className="text-lg font-semibold text-navy-900">{p.ringkas.pct.toFixed(1)}%</span>
                      </td>
                      <td className="text-center">
                        <Badge tone={kat.tone}>{kat.label}</Badge>
                      </td>
                      <td className="text-center">
                        <button className="btn-ghost btn-sm" onClick={() => handlePrint(p, 'laporan')}>🖨 Laporan</button>
                      </td>
                      <td className="text-center">
                        <button className="btn-ghost btn-sm" onClick={() => handlePrint(p, 'berita-acara')}>🖨 BA</button>
                      </td>
                      {scope.canEdit && (
                        <td className="text-center">
                          <button className="btn-ghost btn-sm" onClick={() => setEditing(p)}>✎</button>
                        </td>
                      )}
                      {scope.canEdit && (
                        <td className="text-center">
                          <button className="btn-danger btn-sm" onClick={() => setConfirm(p)}>✕</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="Belum ada hasil pendampingan" description="Tambahkan catatan hasil pendampingan untuk memulai." />
      )}

      {editing && (
        <FormPendampinganModal
          key={editing.id || 'new'}
          value={editing}
          onClose={() => setEditing(null)}
          onSave={onSave}
          madrasahList={state.madrasah}
          pengawasList={state.pengawas}
          instrumen={state.instrumen}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { remove('pendampingan', confirm.id); toast.success('Hasil pendampingan dihapus') }}
        title="Hapus Hasil Pendampingan"
        message="Yakin menghapus catatan ini?"
      />

      {printItem && (
        <PrintModal
          item={printItem}
          mode={printMode}
          settings={state.settings}
          instrumen={state.instrumen}
          madrasah={state.madrasah.find((m) => m.id === printItem.madrasahId)}
          pengawas={state.pengawas.find((p) => p.id === printItem.pengawasId) || resolvePengawasFromUser(user, state.pengawas)}
          user={user}
          onClose={() => setPrintItem(null)}
        />
      )}
    </>
  )
}

function InfoBlock({ label, content }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-line">{content || '—'}</p>
    </div>
  )
}

function FormPendampinganModal({ value, onClose, onSave, madrasahList, pengawasList, instrumen }) {
  const scope = useScope()
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const updSkor = (id, v) => setForm((f) => ({ ...f, skor: { ...f.skor, [id]: v } }))
  const updKet = (id, v) => setForm((f) => ({ ...f, keterangan: { ...f.keterangan, [id]: v } }))
  const ringkas = summarizeSkor(form.skor, instrumen)
  const submit = (e) => { e.preventDefault(); onSave(form) }

  const fillAll = () => {
    const madrasah = madrasahList.find((m) => m.id === form.madrasahId)
    const draft = generateDraftPendampingan({ form, madrasah, instrumen })
    setForm((f) => ({ ...f, ...draft }))
  }
  const fillField = (field) => {
    const madrasah = madrasahList.find((m) => m.id === form.madrasahId)
    const draft = generateFieldDraft(field, { form, madrasah, instrumen, MATERI_DEFAULTS })
    setForm((f) => ({ ...f, [field]: draft }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit Hasil Pendampingan' : 'Tambah Hasil Pendampingan'}
      size="xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" form="form-pendampingan" type="submit">Simpan</button>
        </>
      }
    >
      <form id="form-pendampingan" onSubmit={submit} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-toska-50 border border-toska-200 rounded-lg px-4 py-2">
          <p className="text-xs text-toska-900">
            💡 <strong>Tip:</strong> Klik <em>Isi Otomatis Semua</em> untuk dapat draft awal berdasarkan skor instrumen yang sudah Bapak isi. Edit/sesuaikan setelahnya.
          </p>
          <button type="button" className="btn-toska btn-sm" onClick={fillAll} disabled={!form.madrasahId}>
            ✨ Isi Otomatis Semua
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Tanggal" required><input type="date" className="input" value={form.tanggal} onChange={(e) => upd('tanggal', e.target.value)} required /></Field>
          <Field label="Madrasah" required>
            <select className="input" value={form.madrasahId} onChange={(e) => upd('madrasahId', e.target.value)} required>
              <option value="">— Pilih —</option>
              {madrasahList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </Field>
          <Field label="Pengawas" required>
            <select className="input" value={form.pengawasId} onChange={(e) => {
              const pid = e.target.value
              const p = pengawasList.find((x) => x.id === pid)
              setForm((f) => ({ ...f, pengawasId: pid, namaLengkap: p?.nama || f.namaLengkap }))
            }} required>
              <option value="">— Pilih —</option>
              {pengawasList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Nama Lengkap (gelar)">
          <input className="input" value={form.namaLengkap || ''} onChange={(e) => upd('namaLengkap', e.target.value)} placeholder="Otomatis terisi saat pilih pengawas, bisa diedit" />
        </Field>
        <p className="text-xs text-slate-500 italic">ℹ️ NIP diambil otomatis dari data pengawas yang dipilih.</p>

        <Field label="Bentuk Kegiatan">
          <select
            className="input"
            value={form.bentuk}
            onChange={(e) => {
              const b = e.target.value
              setForm((f) => {
                const next = { ...f, bentuk: b }
                // Auto-fill kegiatan dari template bentukan, tapi hanya jika kegiatan masih kosong atau dari template default
                const materiVals = Object.values(MATERI_DEFAULTS)
                if (!f.kegiatan || materiVals.includes(f.kegiatan)) {
                  next.kegiatan = MATERI_DEFAULTS[b] || ''
                }
                return next
              })
            }}
          >
            <option value="">— Pilih bentuk —</option>
            {BENTUK_KEGIATAN.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>

        <FieldWithFill label="Kegiatan Pendampingan" required onFill={() => fillField('kegiatan')} disabled={!form.madrasahId}>
          <input className="input" value={form.kegiatan} onChange={(e) => upd('kegiatan', e.target.value)} required />
        </FieldWithFill>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="font-semibold text-navy-900">Skor Instrumen</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-600">
                Total {ringkas.totalSkor}/{ringkas.maksSkor} · {ringkas.pct.toFixed(1)}% · <Badge tone={ringkas.kategori.tone}>{ringkas.kategori.label}</Badge>
              </p>
              {scope.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      '⚠️ Konfirmasi Pilih Semua Skor 3\n\n' +
                      'Apakah sudah sesuai dengan hasil observasi?\n\n' +
                      'Semua indikator akan diset ke skor 3 (Terlaksana Sangat Baik).\n' +
                      'Pastikan data sudah sesuai dengan kondisi di lapangan.\n\n' +
                      'Klik OK untuk melanjutkan, atau Batal untuk membatalkan.'
                    )
                    if (!ok) return
                    const newSkor = {}
                    const newKet = {}
                    instrumen.forEach((a) => a.indikator.forEach((ind) => {
                      newSkor[ind.id] = 3
                      newKet[ind.id] = SKOR_LABELS[3]
                    }))
                    setForm((f) => ({ ...f, skor: newSkor, keterangan: newKet }))
                  }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded bg-toska-100 text-toska-800 hover:bg-toska-200 transition whitespace-nowrap"
                >✓ Pilih semua skor 3</button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {instrumen.map((aspek) => (
              <div key={aspek.id} className="rounded-lg border border-slate-200">
                <div className="px-4 py-2 bg-navy-50 border-b border-navy-100 flex items-center justify-between">
                  <p className="font-semibold text-sm text-navy-900">Aspek {aspek.kode}. {aspek.nama}</p>
                </div>
                <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 items-center">
                  <span className="col-span-7">Indikator</span>
                  <span className="col-span-2 text-center">Skor</span>
                  <span className="col-span-3">Catatan</span>
                </div>
                {/* Skor column header: 0 1 2 3 aligned with boxes */}
                <div className="grid grid-cols-12 gap-2 items-center px-4 py-1 bg-emerald-50 border-b border-emerald-200">
                  <div className="col-span-7" />
                  <div className="col-span-2 grid grid-cols-4 gap-1 justify-items-center">
                    {[0,1,2,3].map((s) => (
                      <span key={s} className="text-[10px] font-bold text-emerald-700 text-center" style={{width:24}}>{s}</span>
                    ))}
                  </div>
                  <div className="col-span-3" />
                </div>
                <div className="divide-y divide-slate-100">
                  {aspek.indikator.map((ind) => (
                    <div key={ind.id} className="grid grid-cols-12 gap-2 items-center px-4 py-2.5">
                      <p className="col-span-7 text-sm text-slate-700">
                        <span className="text-xs font-mono text-toska-700 mr-2">{aspek.kode}{ind.nomor}</span>
                        {ind.teks}
                      </p>
                      <div className="col-span-2 grid grid-cols-4 gap-1 items-center justify-items-center">
                        {[0, 1, 2, 3].map((s) => {
                          const selected = form.skor?.[ind.id] === s
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const newSkor = selected ? undefined : s
                                updSkor(ind.id, newSkor)
                                updKet(ind.id, newSkor != null ? SKOR_LABELS[newSkor] : '')
                              }}
                              style={{
                                width: 24, height: 24, margin: '0 auto',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 3, border: `1.5px solid ${selected ? '#ffffff' : '#cbd5e1'}`,
                                backgroundColor: selected ? '#059669' : '#ffffff',
                                color: selected ? '#ffffff' : '#475569',
                                fontWeight: 'bold', fontSize: 11,
                                cursor: 'pointer', transition: 'all 0.15s',
                                boxShadow: selected ? '0 2px 6px rgba(5,150,105,0.3)' : 'none'
                              }}
                              title={`${s} · ${SKOR_LABELS[s]}`}
                            >
                              {selected ? '✓' : ''}
                            </button>
                          )
                        })}
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`text-xs block flex-1 px-2 py-1.5 rounded ${form.keterangan?.[ind.id] ? 'bg-navy-50 text-navy-800 font-medium' : 'text-slate-400 italic'}`}>
                          {form.keterangan?.[ind.id] || '— pilih skor —'}
                        </span>
                        {scope.canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm(`Indikator ${aspek.kode}${ind.nomor}: pilih skor 3 (Terlaksana Sangat Baik)?\n\nPastikan sudah sesuai hasil observasi.`)) return
                              updSkor(ind.id, 3)
                              updKet(ind.id, SKOR_LABELS[3])
                            }}
                            className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                          >Pilih ✓</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-slate-200" />
        <p className="font-semibold text-navy-900">Temuan &amp; Rekomendasi</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldWithFill label="Temuan Positif" onFill={() => fillField('temuanPositif')} disabled={!form.madrasahId}>
            <textarea className="input" rows={4} value={form.temuanPositif} onChange={(e) => upd('temuanPositif', e.target.value)} />
          </FieldWithFill>
          <FieldWithFill label="Permasalahan / Kendala" onFill={() => fillField('kendala')} disabled={!form.madrasahId}>
            <textarea className="input" rows={4} value={form.kendala} onChange={(e) => upd('kendala', e.target.value)} />
          </FieldWithFill>
          <FieldWithFill label="Hasil Observasi" onFill={() => fillField('observasi')} disabled={!form.madrasahId}>
            <textarea className="input" rows={4} value={form.observasi} onChange={(e) => upd('observasi', e.target.value)} />
          </FieldWithFill>
          <FieldWithFill label="Rekomendasi Pengawas" onFill={() => fillField('rekomendasi')} disabled={!form.madrasahId}>
            <textarea className="input" rows={4} value={form.rekomendasi} onChange={(e) => upd('rekomendasi', e.target.value)} />
          </FieldWithFill>
          <FieldWithFill label="Rencana Tindak Lanjut Madrasah" onFill={() => fillField('rencanaTindakLanjut')} disabled={!form.madrasahId}>
            <textarea className="input" rows={4} value={form.rencanaTindakLanjut} onChange={(e) => upd('rencanaTindakLanjut', e.target.value)} />
          </FieldWithFill>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Batas Waktu TL"><input className="input" type="date" value={form.batasTL} onChange={(e) => upd('batasTL', e.target.value)} /></Field>
            <Field label="Status Tindak Lanjut">
              <select className="input" value={form.statusTL} onChange={(e) => upd('statusTL', e.target.value)}>
                {STATUS_TINDAK_LANJUT.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Tautan Bukti Kegiatan (opsional)">
          <input className="input" placeholder="https://drive.google.com/..." value={form.buktiLink} onChange={(e) => upd('buktiLink', e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

function PrintModal({ item, mode, settings, instrumen, madrasah, pengawas, user, onClose }) {
  const ringkas = summarizeSkor(item.skor, instrumen)
  const isBA = mode === 'berita-acara'
  // Fallback chain: pengawas prop → user data langsung
  const resolvedPengawas = pengawas || user
  const pengawasNama = resolvedPengawas?.nama || '____________________'
  const pengawasNip = resolvedPengawas?.nip || ''
  const pengawasNamaLengkap = item.namaLengkap || resolvedPengawas?.namaLengkap || resolvedPengawas?.nama || ''
  return (
    <Modal open onClose={onClose} size="xl"
      title={`Pratinjau Cetak — ${isBA ? 'Berita Acara' : 'Laporan'} Pendampingan`}
      footer={<><button className="btn-ghost" onClick={onClose}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea({ title: isBA ? 'Berita Acara Pendampingan' : 'Laporan Hasil Pendampingan' })}>🖨 Cetak</button></>}>
      <div className="print-area bg-white p-6 text-sm">
        <style>{`
          @media print {
            .print-area, .print-area * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `}</style>
        <PrintHeader settings={settings} judul={isBA ? 'BERITA ACARA PENDAMPINGAN IMPLEMENTASI KBC' : 'LAPORAN HASIL PENDAMPINGAN IMPLEMENTASI KBC'} />
        <table className="w-full mb-4">
          <tbody>
            <Row k="Tanggal" v={formatDateLong(item.tanggal)} />
            <Row k="Madrasah" v={`${madrasah?.nama ?? '-'} (${madrasah?.jenjang ?? '-'})`} />
            <Row k="Kepala Madrasah" v={madrasah?.kepala || madrasah?.namaKepala || '(belum diisi di Master Data)'} />
            <Row k="Pengawas Pendamping" v={pengawasNama} />
            <Row k="Kegiatan" v={item.kegiatan} />
          </tbody>
        </table>

        {!isBA && (
          <>
            <Section title="Temuan Positif" content={item.temuanPositif} />
            <Section title="Permasalahan / Kendala" content={item.kendala} />
            <Section title="Hasil Observasi" content={item.observasi} />
            <Section title="Rekomendasi Pengawas" content={item.rekomendasi} />
            <Section title="Rencana Tindak Lanjut Madrasah" content={item.rencanaTindakLanjut} />

            <p className="font-semibold text-navy-900 mt-4 mb-2">Hasil Skor Instrumen</p>
            <div className="mb-4">
              {instrumen.map((aspek) => (
                <div key={aspek.id} className="mb-3">
                  <p className="font-semibold text-navy-800 text-xs uppercase tracking-wide mb-1">{aspek.kode}. {aspek.nama}</p>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-200 px-2 py-1 text-left w-2/5">Indikator</th>
                        <th className="border border-slate-200 px-1 py-1 text-center w-4">0</th>
                        <th className="border border-slate-200 px-1 py-1 text-center w-4">1</th>
                        <th className="border border-slate-200 px-1 py-1 text-center w-4">2</th>
                        <th className="border border-slate-200 px-1 py-1 text-center w-4">3</th>
                        <th className="border border-slate-200 px-2 py-1 text-center w-12">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aspek.indikator.map((ind) => {
                        const s = item.skor?.[ind.id]
                        return (
                          <tr key={ind.id}>
                            <td className="border border-slate-200 px-2 py-1">{aspek.kode}{ind.nomor} {ind.teks}</td>
                            {[0, 1, 2, 3].map((sc) => (
                              <td key={sc} className="border border-slate-200 px-1 py-1 text-center">
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 22, height: 22, lineHeight: '22px',
                                    textAlign: 'center', borderRadius: 3,
                                    border: `2px solid ${s === sc ? '#059669' : '#94a3b8'}`,
                                    backgroundColor: s === sc ? '#059669' : 'transparent',
                                    color: '#ffffff',
                                    fontWeight: 'bold', fontSize: 14
                                  }}
                                >
                                  {s === sc ? '✓' : ''}
                                </span>
                              </td>
                            ))}
                            <td className="border border-slate-200 px-2 py-1 text-center text-xs">{SKOR_LABELS[s] || '—'}</td>
                          </tr>
                        )
                      })}
                      <tr className="bg-slate-50 font-semibold">
                        <td className="border border-slate-200 px-2 py-1 text-right" colSpan={5}>Sub Total {aspek.nama}</td>
                        <td className="border border-slate-200 px-2 py-1 text-center">
                          {(() => { const t = aspek.indikator.reduce((sum, ind) => sum + (item.skor?.[ind.id] ?? 0), 0); const m = aspek.indikator.length * 3; return `${t}/${m} (${((t/m)*100).toFixed(0)}%)` })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm font-semibold text-center">
                Total: {ringkas.totalSkor}/{ringkas.maksSkor} = {ringkas.pct.toFixed(1)}% ({ringkas.kategori.label})
              </div>
            </div>
          </>
        )}

        {isBA && (
          <div className="text-justify leading-relaxed mt-3">
            <p>Pada hari {formatDateLong(item.tanggal)}, telah dilaksanakan kegiatan <strong>{item.kegiatan}</strong> dalam rangka pendampingan implementasi Kurikulum Berbasis Cinta (KBC) di <strong>{madrasah?.nama ?? '-'}</strong> oleh <strong>{pengawasNama}</strong> selaku Pengawas Madrasah.</p>
            <p className="mt-2">Hasil capaian implementasi KBC pada kegiatan ini sebesar <strong>{ringkas.pct.toFixed(1)}%</strong> dengan kategori <strong>{ringkas.kategori.label}</strong>.</p>
            <p className="mt-2">Catatan rekomendasi pengawas: {item.rekomendasi || '—'}</p>
            <p className="mt-2">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
          </div>
        )}

        <SingleSignature tempat="Jember" tanggal={item.tanggal} namaPengawas={pengawasNama} nipPengawas={pengawasNip} namaLengkap={pengawasNamaLengkap} />
      </div>
    </Modal>
  )
}

function Row({ k, v }) {
  return (
    <tr>
      <td className="py-1 pr-3 align-top w-44 text-slate-500">{k}</td>
      <td className="py-1 align-top">: <span className="font-medium text-navy-900">{v}</span></td>
    </tr>
  )
}

function Section({ title, content }) {
  return (
    <div className="mt-3">
      <p className="font-semibold text-navy-900">{title}</p>
      <p className="whitespace-pre-line text-slate-700">{content || '—'}</p>
    </div>
  )
}

function Field({ label, required, children }) {
  return <div><label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>{children}</div>
}

function FieldWithFill({ label, required, onFill, disabled, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label !mb-0">{label}{required && <span className="text-rose-500"> *</span>}</label>
        <button
          type="button"
          className="text-[10px] uppercase tracking-wide text-toska-700 hover:text-toska-900 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onFill}
          disabled={disabled}
          title={disabled ? 'Pilih madrasah dulu' : 'Isi otomatis berdasarkan skor instrumen'}
        >
          ✨ Isi otomatis
        </button>
      </div>
      {children}
    </div>
  )
}

function SingleSignature({ tempat = 'Jember', tanggal, namaPengawas, nipPengawas, namaLengkap }) {
  const t = tanggal ? new Date(tanggal) : new Date()
  const tanggalLabel = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="mt-10 text-sm font-serif flex justify-end">
      <div className="text-center" style={{ marginRight: '10%' }}>
        <p>{tempat}, {tanggalLabel}</p>
        <p>Pengawas Pendamping,</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">Subariyanto</p>
        {nipPengawas && <p>NIP. {nipPengawas}</p>}
        <p className="mt-2">Nama Lengkap dengan gelar</p>
        <p>Subariyanto, S.Pd, M.Pd.I</p>
      </div>
    </div>
  )
}
