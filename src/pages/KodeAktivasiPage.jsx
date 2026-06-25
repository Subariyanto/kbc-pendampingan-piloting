import { useEffect, useMemo, useState, useRef } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  generateSignedCode,
  TIER_OPTIONS,
  getAdminCodes,
  addAdminCode,
  updateAdminCode,
  deleteAdminCode,
  saveAdminCodes,
  getRevokedCodes,
  addRevokedCode,
  removeRevokedCode
} from '../lib/signedLicense.js'
import { downloadJSON, readJSONFile } from '../lib/utils.js'

const TIER_TONES = {
  pro: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  basic: 'bg-toska-100 text-toska-800 border-toska-200',
  demo: 'bg-amber-100 text-amber-800 border-amber-200'
}

const STATUS_TONES = {
  aktif: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  belum_aktif: 'bg-sky-100 text-sky-800 border-sky-300'
}

const STATUS_LABELS = {
  aktif: '✅ Aktif',
  belum_aktif: '⏳ Belum Aktif'
}

export default function KodeAktivasiPage() {
  const toast = useToast()
  const [codes, setCodes] = useState([])
  const [revoked, setRevoked] = useState([])
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

  const refresh = () => {
    setCodes(getAdminCodes())
    setRevoked(getRevokedCodes())
  }

  useEffect(() => { refresh() }, [])

  const getStatus = (c) => {
    if (c.status === 'aktif' || c.soldTo) return 'aktif'
    return 'belum_aktif'
  }

  const filtered = useMemo(() => {
    return codes.filter((c) => {
      const status = getStatus(c)
      if (filterStatus !== 'all' && filterStatus !== status) return false
      if (filterTier !== 'all' && c.tier !== filterTier) return false
      if (search) {
        const q = search.toLowerCase()
        return c.code.toLowerCase().includes(q) ||
               (c.soldTo || '').toLowerCase().includes(q) ||
               (c.note || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [codes, revoked, search, filterTier, filterStatus])

  const stats = useMemo(() => ({
    total: codes.length,
    aktif: codes.filter((c) => getStatus(c) === 'aktif').length,
    belumAktif: codes.filter((c) => getStatus(c) === 'belum_aktif').length
  }), [codes])

  const onCopy = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Kode disalin'))
      .catch(() => toast.error('Gagal menyalin'))
  }

  const onAktifkan = (code, namaPengawas) => {
    updateAdminCode(code, { soldTo: namaPengawas, soldAt: Date.now(), status: 'aktif' })
    refresh()
    toast.success(`Kode diaktifkan untuk ${namaPengawas}`)
  }

  const onNonaktifkan = (code) => {
    updateAdminCode(code, { soldTo: null, soldAt: null, status: 'belum_aktif' })
    refresh()
    toast.success('Kode dinonaktifkan')
  }

  const onDelete = (record) => {
    deleteAdminCode(record.code)
    refresh()
    toast.success('Kode dihapus')
    setConfirmDelete(null)
  }

  const onExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      codes: getAdminCodes(),
      revoked: getRevokedCodes()
    }
    downloadJSON(`kbc-admin-codes-${new Date().toISOString().slice(0, 10)}.json`, payload)
    toast.success('Daftar kode diekspor')
  }

  const onPrint = () => {
    const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const rows = filtered.map((c, i) => {
      const status = getStatus(c)
      return `<tr>
        <td style="text-align:center;padding:6px 8px;border:1px solid #333">${i + 1}</td>
        <td style="font-family:monospace;font-size:11px;padding:6px 8px;border:1px solid #333">${c.code}</td>
        <td style="padding:6px 8px;border:1px solid #333">${c.label}</td>
        <td style="padding:6px 8px;border:1px solid #333">${c.soldTo || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #333;text-align:center">${status === 'aktif' ? '✅ Aktif' : '⏳ Belum Aktif'}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:11px">${c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><title>Cetak Kode Aktivasi</title>
<style>
  body{font-family:Arial,sans-serif;margin:20px;font-size:12px}
  .header{display:flex;align-items:center;gap:12px;border-bottom:3px solid #102a4d;padding-bottom:10px;margin-bottom:16px}
  .header img{width:60px;height:60px}
  .header h2{margin:0;color:#102a4d;font-size:16px}
  .header p{margin:2px 0;color:#555;font-size:11px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#102a4d;color:white;padding:8px;border:1px solid #333;font-size:11px;text-align:center}
  .footer{margin-top:24px;text-align:right;font-size:11px}
  @media print{body{margin:0}.no-print{display:none}}
</style></head><body>
<div class="header">
  <img src="https://subariyanto.github.io/kbc-pendampingan-piloting/logo.png" alt="logo"/>
  <div>
    <h2>Kode Aktivasi</h2>
    <p>Pokjawas Madrasah Kabupaten Jember</p>
    <p>Dicetak: ${now} | Total: ${filtered.length} kode</p>
  </div>
</div>
<table>
  <thead><tr><th style="width:30px">No</th><th>Kode</th><th>Tier</th><th>Nama Pengawas</th><th>Status</th><th>Diterbitkan</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><p>Jember, ${now}<br/>Pengawas Madrasah</p><br/><br/><p><strong>Subariyanto, S.Pd, M.Pd.I</strong><br/>NIP. 197002122005011004</p></div>
</body></html>`

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
    } else {
      toast.error('Popup diblokir browser')
    }
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readJSONFile(file)
      if (!data || !Array.isArray(data.codes)) throw new Error('Format file tidak valid')
      const existing = getAdminCodes()
      const merged = [...existing]
      let added = 0
      for (const c of data.codes) {
        if (!merged.find((x) => x.code === c.code)) {
          merged.push(c)
          added++
        }
      }
      saveAdminCodes(merged)
      refresh()
      toast.success(`${added} kode baru di-import`)
    } catch (err) {
      toast.error('Gagal import: ' + err.message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <PageHeader
        title="Kode Aktivasi"
        description="Terbitkan dan kelola kode aktivasi untuk pengawas madrasah."
        icon="🎫"
        actions={
          <>
            <button className="btn-ghost" onClick={onExport}>📥 Export</button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>📤 Import</button>
            <button className="btn-ghost" onClick={onPrint}>🖨️ Cetak</button>
            <button className="btn-primary" onClick={() => setCreating(true)}>➕ Terbitkan Kode</button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card-pad">
          <p className="text-xs text-slate-500">Total Kode</p>
          <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
        </div>
        <div className="card-pad">
          <p className="text-xs text-slate-500">✅ Aktif</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.aktif}</p>
        </div>
        <div className="card-pad">
          <p className="text-xs text-slate-500">⏳ Belum Aktif</p>
          <p className="text-2xl font-bold text-sky-700">{stats.belumAktif}</p>
        </div>
      </div>

      {/* Info tracking manual */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4 text-xs text-sky-800">
        <strong>💡 Cara kerja:</strong> Saat memberikan kode ke pengawas, klik <strong>Aktifkan</strong> dan isi nama pengawas. Status otomatis berubah jadi ✅ Aktif. Data aktivasi sebenarnya tersimpan di browser masing-masing pengawas (localStorage).
      </div>

      {/* Filter */}
      <div className="card-pad mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select className="input" value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">Semua tier</option>
            <option value="pro">Pro Lifetime</option>
            <option value="basic">Basic Lifetime</option>
            <option value="demo">Trial</option>
          </select>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="belum_aktif">Belum Aktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={codes.length === 0 ? 'Belum ada kode' : 'Tidak ada yang cocok'}
            description={codes.length === 0
              ? 'Klik "Terbitkan Kode" untuk membuat kode pertama.'
              : 'Ubah filter atau kata kunci.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th className="w-[100px]">Aksi</th>
                  <th className="w-[30px] text-center">No</th>
                  <th>Kode</th>
                  <th>Tier</th>
                  <th className="text-center">Nama Pengawas</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <CodeRow
                    key={c.code}
                    no={idx + 1}
                    record={c}
                    status={getStatus(c)}
                    onCopy={() => onCopy(c.code)}
                    onAktifkan={(nama) => onAktifkan(c.code, nama)}
                    onNonaktifkan={() => onNonaktifkan(c.code)}
                    onDelete={() => setConfirmDelete(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <CreateCodeModal
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh() }}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Hapus Kode"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button className="btn-danger" onClick={() => onDelete(confirmDelete)}>Hapus</button>
            </>
          }
        >
          <p className="text-sm">
            Yakin menghapus kode <strong className="font-mono">{confirmDelete.code}</strong>?
          </p>
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠️ Catatan dihapus dari daftar. Kode tetap valid di browser yang sudah aktivasi.
          </p>
        </Modal>
      )}
    </>
  )
}

function CodeRow({ no, record, status, onCopy, onAktifkan, onNonaktifkan, onDelete }) {
  const [editingNama, setEditingNama] = useState(false)
  const [namaPengawas, setNamaPengawas] = useState(record.soldTo || '')

  const isAktif = status === 'aktif'

  return (
    <tr>
      {/* AKSI — tombol di kiri */}
      <td className="whitespace-nowrap">
        {!isAktif ? (
          <button
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
            onClick={() => {
              const nama = record.soldTo || prompt('Nama pengawas yang menerima kode:')
              if (nama?.trim()) onAktifkan(nama.trim())
            }}
          >
            ✅ Aktifkan
          </button>
        ) : (
          <button
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition shadow-sm"
            onClick={onNonaktifkan}
          >
            ⏸ Nonaktifkan
          </button>
        )}
        <button className="ml-1 p-1.5 rounded text-slate-400 hover:text-rose-600 transition" onClick={onDelete} title="Hapus">🗑</button>
      </td>

      {/* NO */}
      <td className="text-center text-xs text-slate-500">{no}</td>

      {/* KODE */}
      <td>
        <button onClick={onCopy} className="font-mono text-xs font-semibold text-navy-900 hover:text-toska-700 cursor-pointer flex items-center gap-1" title="Klik untuk salin">
          <span className="break-all">{record.code}</span>
          <span className="text-[10px]">📋</span>
        </button>
      </td>

      {/* TIER */}
      <td>
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${TIER_TONES[record.tier]}`}>
          {record.label}
        </span>
      </td>

      {/* NAMA PENGAWAS — tengah */}
      <td className="text-center">
        {editingNama ? (
          <input
            className="input input-sm text-xs text-center"
            value={namaPengawas}
            onChange={(e) => setNamaPengawas(e.target.value)}
            placeholder="Nama pengawas"
            autoFocus
            onBlur={() => {
              if (namaPengawas.trim()) {
                onAktifkan(namaPengawas.trim())
              } else {
                onNonaktifkan()
              }
              setEditingNama(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (namaPengawas.trim()) onAktifkan(namaPengawas.trim())
                else onNonaktifkan()
                setEditingNama(false)
              }
            }}
          />
        ) : record.soldTo ? (
          <div className="cursor-pointer hover:text-toska-700" onClick={() => { setNamaPengawas(record.soldTo); setEditingNama(true) }}>
            <p className="font-semibold text-navy-900 text-sm">{record.soldTo}</p>
            {record.soldAt && (
              <p className="text-[10px] text-slate-500">
                sejak {new Date(record.soldAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        ) : (
          <button className="text-xs text-slate-400 hover:text-toska-700" onClick={() => setEditingNama(true)}>
            <span className="italic">belum diisi</span>
          </button>
        )}
      </td>

      {/* STATUS */}
      <td className="text-center">
        <span className={`inline-block px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_TONES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </td>

    </tr>
  )
}

function CreateCodeModal({ onClose, onSaved }) {
  const toast = useToast()
  const [tierKey, setTierKey] = useState('PRO')
  const [bulkCount, setBulkCount] = useState(1)
  const [namaPengawas, setNamaPengawas] = useState('')
  const [note, setNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState([])

  const handleGenerate = async (e) => {
    e.preventDefault()
    const count = Math.min(50, Math.max(1, parseInt(bulkCount) || 1))
    setGenerating(true)
    try {
      const generated = []
      for (let i = 0; i < count; i++) {
        const c = await generateSignedCode(tierKey)
        const record = {
          ...c,
          soldTo: namaPengawas.trim() || null,
          soldAt: namaPengawas.trim() ? Date.now() : null,
          status: namaPengawas.trim() ? 'aktif' : 'belum_aktif',
          note: note.trim()
        }
        addAdminCode(record)
        generated.push(record)
      }
      setResults(generated)
      toast.success(`${count} kode berhasil diterbitkan`)
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const onCopyAll = () => {
    const text = results.map((r) => r.code).join('\n')
    navigator.clipboard.writeText(text).then(() => toast.success('Semua kode disalin'))
  }

  if (results.length > 0) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Kode Berhasil Diterbitkan"
        footer={
          <>
            <button className="btn-ghost" onClick={onCopyAll}>📋 Salin Semua</button>
            <button className="btn-primary" onClick={onSaved}>Selesai</button>
          </>
        }
      >
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3 mb-3">
          ✅ {results.length} kode berhasil dibuat{results[0]?.soldTo ? ` untuk ${results[0].soldTo}` : ''}. Salin & kirim kode ke pengawas.
        </p>
        <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded max-h-64 overflow-y-auto space-y-1">
          {results.map((r) => (
            <div key={r.code} className="break-all">{r.code}</div>
          ))}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Terbitkan Kode Aktivasi"
      footer={
        <>
          <button className="btn-ghost" type="button" onClick={onClose}>Batal</button>
          <button className="btn-primary" type="submit" form="codeForm" disabled={generating}>
            {generating ? 'Generating...' : `Terbitkan ${bulkCount > 1 ? bulkCount + ' Kode' : 'Kode'}`}
          </button>
        </>
      }
    >
      <form id="codeForm" onSubmit={handleGenerate} className="space-y-3">
        <div className="bg-sky-50 border border-sky-200 rounded p-3 text-xs text-sky-900">
          💡 Kode ditandatangani offline pakai HMAC-SHA256. Bisa diaktivasi tanpa internet.
        </div>

        <div>
          <label className="label">Nama Pengawas <span className="text-slate-400 text-[10px]">(opsional)</span></label>
          <input
            className="input"
            value={namaPengawas}
            onChange={(e) => setNamaPengawas(e.target.value)}
            placeholder="Kosongkan jika belum tahu penerimanya"
          />
          <p className="text-[10px] text-slate-500 mt-1">Jika diisi → kode langsung berstatus <strong>Aktif</strong>. Kosongkan → <strong>Belum Aktif</strong>.</p>
        </div>

        <div>
          <label className="label">Tier / Jenis Lisensi</label>
          <div className="grid grid-cols-1 gap-2">
            {TIER_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${tierKey === opt.key ? 'border-navy-900 bg-navy-50 ring-1 ring-navy-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={opt.key}
                  checked={tierKey === opt.key}
                  onChange={() => setTierKey(opt.key)}
                />
                <div className="flex-1">
                  <p className="font-medium text-navy-900">{opt.label}</p>
                  <p className="text-xs text-slate-500">
                    {opt.expiryDays > 0 ? `Berlaku ${opt.expiryDays} hari` : 'Lifetime — tidak expired'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${TIER_TONES[opt.tier]}`}>
                  {opt.tier.toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Jumlah Kode</label>
            <input
              type="number"
              className="input"
              min="1"
              max="50"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Catatan <span className="text-slate-400 text-[10px]">(opsional)</span></label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. KKMA 04 batch Juni"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
