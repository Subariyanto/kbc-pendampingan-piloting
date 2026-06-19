import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader, { PrintSignature } from '../components/PrintHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { STATUS_TINDAK_LANJUT, SKOR_LABELS } from '../lib/constants.js'
import { formatDate, formatDateLong, searchMatch, STATUS_TINDAK_LANJUT_TONES, todayISO, kategoriKBC } from '../lib/utils.js'
import { summarizeSkor } from '../lib/scoring.js'
import { generateDraftPendampingan, generateFieldDraft } from '../lib/draftPendampingan.js'
import { printPrintArea } from '../lib/printHelper.js'

const EMPTY = {
  tanggal: todayISO(), madrasahId: '', pengawasId: '', kegiatan: '',
  temuanPositif: '', kendala: '', observasi: '', rekomendasi: '',
  rencanaTindakLanjut: '', batasTL: '', statusTL: 'Belum Dikerjakan',
  buktiLink: '', skor: {}
}

export default function PendampinganPage() {
  const { state, addOrUpdate, remove } = useData()
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
        <div className="space-y-4">
          {data.map((p) => {
            const kat = p.ringkas.kategori
            return (
              <div key={p.id} className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(p.tanggal)}</span>
                      <span>•</span>
                      <span>{p.pengawas}</span>
                    </div>
                    <p className="font-semibold text-navy-900 mt-1">{p.kegiatan}</p>
                    <p className="text-sm text-slate-600">{p.madrasah}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Capaian</p>
                      <p className="text-lg font-semibold text-navy-900">{p.ringkas.pct.toFixed(1)}%</p>
                    </div>
                    <Badge tone={kat.tone}>{kat.label}</Badge>
                    <div className="flex flex-wrap gap-1">
                      <button className="btn-ghost btn-sm" onClick={() => handlePrint(p, 'laporan')}>🖨 Laporan</button>
                      <button className="btn-ghost btn-sm" onClick={() => handlePrint(p, 'berita-acara')}>🖨 BA</button>
                      {scope.canEdit && <button className="btn-ghost btn-sm" onClick={() => setEditing(p)}>✎</button>}
                      {scope.canEdit && <button className="btn-danger btn-sm" onClick={() => setConfirm(p)}>✕</button>}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                  <InfoBlock label="Temuan Positif" content={p.temuanPositif} />
                  <InfoBlock label="Permasalahan / Kendala" content={p.kendala} />
                  <InfoBlock label="Hasil Observasi" content={p.observasi} />
                  <InfoBlock label="Rekomendasi Pengawas" content={p.rekomendasi} />
                  <InfoBlock label="Rencana Tindak Lanjut" content={p.rencanaTindakLanjut} />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status Tindak Lanjut</p>
                    <Badge tone={STATUS_TINDAK_LANJUT_TONES[p.statusTL]}>{p.statusTL}</Badge>
                    {p.batasTL && <p className="text-xs text-slate-500 mt-1">Batas: {formatDate(p.batasTL)}</p>}
                    {p.buktiLink && (
                      <p className="text-xs mt-2"><a href={p.buktiLink} target="_blank" rel="noreferrer" className="text-toska-700 hover:underline">📎 Bukti kegiatan</a></p>
                    )}
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Skor per Aspek</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {p.ringkas.perAspek.map((a) => (
                      <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Aspek {a.kode}</p>
                        <p className="text-sm font-medium text-navy-900 line-clamp-2">{a.nama}</p>
                        <ProgressBar value={a.pct} sublabel={`${a.total}/${a.maks}`} tone="navy" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
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
          pengawas={state.pengawas.find((p) => p.id === printItem.pengawasId)}
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
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const updSkor = (id, v) => setForm((f) => ({ ...f, skor: { ...f.skor, [id]: v } }))
  const ringkas = summarizeSkor(form.skor, instrumen)
  const submit = (e) => { e.preventDefault(); onSave(form) }

  const fillAll = () => {
    const madrasah = madrasahList.find((m) => m.id === form.madrasahId)
    const draft = generateDraftPendampingan({ form, madrasah, instrumen })
    setForm((f) => ({ ...f, ...draft }))
  }
  const fillField = (field) => {
    const madrasah = madrasahList.find((m) => m.id === form.madrasahId)
    const draft = generateFieldDraft(field, { form, madrasah, instrumen })
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
            <select className="input" value={form.pengawasId} onChange={(e) => upd('pengawasId', e.target.value)} required>
              <option value="">— Pilih —</option>
              {pengawasList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </Field>
        </div>

        <FieldWithFill label="Kegiatan Pendampingan" required onFill={() => fillField('kegiatan')} disabled={!form.madrasahId}>
          <input className="input" value={form.kegiatan} onChange={(e) => upd('kegiatan', e.target.value)} required />
        </FieldWithFill>

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

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="font-semibold text-navy-900">Skor Instrumen</p>
            <p className="text-sm text-slate-600">
              Total {ringkas.totalSkor}/{ringkas.maksSkor} · {ringkas.pct.toFixed(1)}% · <Badge tone={ringkas.kategori.tone}>{ringkas.kategori.label}</Badge>
            </p>
          </div>
          <div className="space-y-3">
            {instrumen.map((aspek) => (
              <div key={aspek.id} className="rounded-lg border border-slate-200">
                <div className="px-4 py-2 bg-navy-50 border-b border-navy-100 flex items-center justify-between">
                  <p className="font-semibold text-sm text-navy-900">Aspek {aspek.kode}. {aspek.nama}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {aspek.indikator.map((ind) => (
                    <div key={ind.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-4 py-2.5">
                      <p className="sm:col-span-7 text-sm text-slate-700">
                        <span className="text-xs font-mono text-toska-700 mr-2">{aspek.kode}{ind.nomor}</span>
                        {ind.teks}
                      </p>
                      <div className="sm:col-span-5 flex flex-wrap gap-1">
                        {[1, 2, 3, 4].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updSkor(ind.id, form.skor?.[ind.id] === s ? 0 : s)}
                            className={`flex-1 min-w-[60px] text-xs rounded-md px-2 py-1.5 border transition ${
                              form.skor?.[ind.id] === s
                                ? 'bg-navy-900 text-white border-navy-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-toska-400'
                            }`}
                            title={SKOR_LABELS[s]}
                          >
                            {s} · {SKOR_LABELS[s].split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

function PrintModal({ item, mode, settings, instrumen, madrasah, pengawas, onClose }) {
  const ringkas = summarizeSkor(item.skor, instrumen)
  const isBA = mode === 'berita-acara'
  return (
    <Modal open onClose={onClose} size="xl"
      title={`Pratinjau Cetak — ${isBA ? 'Berita Acara' : 'Laporan'} Pendampingan`}
      footer={<><button className="btn-ghost" onClick={onClose}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea({ title: isBA ? 'Berita Acara Pendampingan' : 'Laporan Hasil Pendampingan' })}>🖨 Cetak</button></>}>
      <div className="print-area bg-white p-6 text-sm">
        <PrintHeader settings={settings} judul={isBA ? 'BERITA ACARA PENDAMPINGAN IMPLEMENTASI KBC' : 'LAPORAN HASIL PENDAMPINGAN IMPLEMENTASI KBC'} />
        <table className="w-full mb-4">
          <tbody>
            <Row k="Tanggal" v={formatDateLong(item.tanggal)} />
            <Row k="Madrasah" v={`${madrasah?.nama ?? '-'} (${madrasah?.jenjang ?? '-'})`} />
            <Row k="Kepala Madrasah" v={madrasah?.kepala ?? '-'} />
            <Row k="Pengawas Pendamping" v={pengawas?.nama ?? '-'} />
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
            <table className="table-clean">
              <thead><tr><th>Aspek</th><th>Indikator</th><th>Skor Maks</th><th>Skor</th><th>Persen</th></tr></thead>
              <tbody>
                {ringkas.perAspek.map((a) => (
                  <tr key={a.id}>
                    <td>{a.kode}. {a.nama}</td><td>{a.indikator}</td><td>{a.maks}</td>
                    <td>{a.total}</td><td>{a.pct.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-slate-50">
                  <td colSpan={2}>Total</td><td>{ringkas.maksSkor}</td><td>{ringkas.totalSkor}</td><td>{ringkas.pct.toFixed(1)}% ({ringkas.kategori.label})</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {isBA && (
          <div className="text-justify leading-relaxed mt-3">
            <p>Pada hari {formatDateLong(item.tanggal)}, telah dilaksanakan kegiatan <strong>{item.kegiatan}</strong> dalam rangka pendampingan implementasi Kurikulum Berbasis Cinta (KBC) di <strong>{madrasah?.nama ?? '-'}</strong> oleh <strong>{pengawas?.nama ?? '-'}</strong> selaku Pengawas Madrasah.</p>
            <p className="mt-2">Hasil capaian implementasi KBC pada kegiatan ini sebesar <strong>{ringkas.pct.toFixed(1)}%</strong> dengan kategori <strong>{ringkas.kategori.label}</strong>.</p>
            <p className="mt-2">Catatan rekomendasi pengawas: {item.rekomendasi || '—'}</p>
            <p className="mt-2">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
          </div>
        )}

        <PrintSignature settings={settings} namaPengawas={pengawas?.nama} nipPengawas={pengawas?.nip} tanggal={item.tanggal} />
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
