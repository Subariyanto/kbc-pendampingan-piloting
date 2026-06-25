import { useEffect, useMemo, useState } from 'react'
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
import { useRef } from 'react'

const TIER_TONES = {
  pro: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  basic: 'bg-toska-100 text-toska-800 border-toska-200',
  demo: 'bg-amber-100 text-amber-800 border-amber-200'
}

const STATUS_TONES = {
  aktif: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  belum_aktif: 'bg-sky-100 text-sky-800 border-sky-200',
  revoked: 'bg-rose-100 text-rose-800 border-rose-200'
}

const STATUS_LABELS = {
  aktif: '✅ Aktif',
  belum_aktif: '⏳ Belum Aktif',
  revoked: '🚫 Dicabut'
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
    if (revoked.includes(c.code)) return 'revoked'
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
    belumAktif: codes.filter((c) => getStatus(c) === 'belum_aktif').length,
    revoked: codes.filter((c) => revoked.includes(c.code)).length
  }), [codes, revoked])

  const onCopy = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Kode disalin'))
      .catch(() => toast.error('Gagal menyalin'))
  }

  const onToggleRevoke = (code) => {
    if (revoked.includes(code)) {
      removeRevokedCode(code)
      toast.success('Kode aktif kembali')
    } else {
      addRevokedCode(code)
      toast.success('Kode dicabut')
    }
    refresh()
  }

  const onDelete = (record) => {
    deleteAdminCode(record.code)
    if (revoked.includes(record.code)) removeRevokedCode(record.code)
    refresh()
    toast.success('Catatan kode dihapus')
    setConfirmDelete(null)
  }

  const onMarkAktif = (code, namaPengawas) => {
    updateAdminCode(code, { soldTo: namaPengawas, soldAt: Date.now(), status: 'aktif' })
    refresh()
    toast.success(`Kode ditandai aktif untuk ${namaPengawas}`)
  }

  const onMarkBelumAktif = (code) => {
    updateAdminCode(code, { soldTo: null, soldAt: null, status: 'belum_aktif' })
    refresh()
    toast.success('Kode ditandai belum aktif')
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
      if (Array.isArray(data.revoked)) {
        for (const r of data.revoked) addRevokedCode(r)
      }
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
        description="Terbitkan kode aktivasi untuk pengawas madrasah. Status kode: Aktif (sudah dipakai) / Belum Aktif (belum dipakai)."
        icon="🎫"
        actions={
          <>
            <button className="btn-ghost" onClick={onExport}>📥 Export JSON</button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>📤 Import JSON</button>
            <button className="btn-primary" onClick={() => setCreating(true)}>➕ Terbitkan Kode</button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
        <div className="card-pad">
          <p className="text-xs text-slate-500">🚫 Dicabut</p>
          <p className="text-2xl font-bold text-rose-700">{stats.revoked}</p>
        </div>
      </div>

      {/* Peringatan tracking manual */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
        <strong>⚠️ Catatan:</strong> Status kode dilacak secara manual. Saat Bapak memberikan kode ke pengawas, tandai sebagai <strong>Aktif</strong> dan isi nama pengawas. Data aktivasi sebenarnya tersimpan di browser masing-masing pengawas (localStorage), bukan di server.
      </div>

      {/* Filter */}
      <div className="card-pad mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="🔍 Cari kode, nama pengawas, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            <option value="revoked">Dicabut</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={codes.length === 0 ? 'Belum ada kode' : 'Tidak ada yang cocok'}
            description={codes.length === 0
              ? 'Klik "Terbitkan Kode" untuk membuat kode pertama. Kode ditandatangani offline dengan HMAC, bisa diaktivasi tanpa internet.'
              : 'Ubah filter atau kata kunci.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Tier</th>
                  <th>Nama Pengawas</th>
                  <th>Status Kode</th>
                  <th>Diterbitkan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CodeRow
                    key={c.code}
                    record={c}
                    status={getStatus(c)}
                    onCopy={() => onCopy(c.code)}
                    onMarkAktif={(nama) => onMarkAktif(c.code, nama)}
                    onMarkBelumAktif={() => onMarkBelumAktif(c.code)}
                    onUpdateNote={(note) => {
                      updateAdminCode(c.code, { note })
                      refresh()
                    }}
                    onToggleRevoke={() => onToggleRevoke(c.code)}
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
          title="Hapus Catatan Kode"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button className="btn-danger" onClick={() => onDelete(confirmDelete)}>Hapus</button>
            </>
          }
        >
          <p className="text-sm">
            Yakin menghapus catatan kode <strong className="font-mono">{confirmDelete.code}</strong>?
          </p>
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠️ Catatan dihapus dari daftar Bapak. <strong>Kode tetap valid</strong> di browser yang sudah aktivasi (karena pakai signed HMAC). Kalau ingin nonaktifkan, gunakan tombol "Cabut" supaya masuk daftar revoked.
          </p>
        </Modal>
      )}
    </>
  )
}

function CodeRow({ record, status, onCopy, onMarkAktif, onMarkBelumAktif, onUpdateNote, onToggleRevoke, onDelete }) {
  const [editingNama, setEditingNama] = useState(false)
  const [namaPengawas, setNamaPengawas] = useState(record.soldTo || '')
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(record.note || '')

  const isRevoked = status === 'revoked'
  const isAktif = status === 'aktif'

  return (
    <tr className={isRevoked ? 'bg-rose-50/50' : ''}>
      <td>
        <button onClick={onCopy} className="font-mono text-xs font-semibold text-navy-900 hover:text-toska-700 cursor-pointer flex items-center gap-1" title="Klik untuk salin">
          <span className="break-all">{record.code}</span>
          <span>📋</span>
        </button>
        {editingNote ? (
          <div className="flex gap-1 mt-1">
            <input
              className="input input-sm text-xs flex-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
              onBlur={() => { onUpdateNote(note); setEditingNote(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateNote(note); setEditingNote(false) } }}
            />
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5 cursor-pointer hover:text-toska-700" onClick={() => setEditingNote(true)}>
            {record.note || <span className="italic text-slate-400">+ catatan</span>}
          </p>
        )}
      </td>
      <td>
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${TIER_TONES[record.tier]}`}>
          {record.label}
        </span>
      </td>
      <td>
        {editingNama ? (
          <div className="flex gap-1">
            <input
              className="input input-sm text-xs"
              value={namaPengawas}
              onChange={(e) => setNamaPengawas(e.target.value)}
              placeholder="Nama pengawas"
              autoFocus
              onBlur={() => {
                if (namaPengawas.trim()) { onMarkAktif(namaPengawas.trim()); setEditingNama(false) }
                else { setEditingNama(false) }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && namaPengawas.trim()) {
                  onMarkAktif(namaPengawas.trim())
                  setEditingNama(false)
                }
              }}
            />
          </div>
        ) : record.soldTo ? (
          <div className="cursor-pointer hover:text-toska-700" onClick={() => setEditingNama(true)}>
            <p className="font-medium text-navy-900 text-sm">{record.soldTo}</p>
            {record.soldAt && (
              <p className="text-[10px] text-slate-500">
                {new Date(record.soldAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        ) : (
          <button className="text-xs text-toska-700 hover:underline" onClick={() => setEditingNama(true)}>
            + isi nama pengawas
          </button>
        )}
      </td>
      <td>
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${STATUS_TONES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </td>
      <td className="text-xs text-slate-500">
        {record.issuedAt ? new Date(record.issuedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
      </td>
      <td className="text-right whitespace-nowrap">
        {isAktif && !isRevoked && (
          <button
            className="btn-sm btn-ghost mr-1 text-amber-700"
            onClick={onMarkBelumAktif}
            title="Tandai belum aktif"
          >
            ↩️
          </button>
        )}
        <button
          className={`btn-sm mr-1 ${isRevoked ? 'btn-toska' : 'btn-ghost'}`}
          onClick={onToggleRevoke}
          title={isRevoked ? 'Aktifkan kembali' : 'Cabut kode (revoke)'}
        >
          {isRevoked ? '✅' : '🚫'}
        </button>
        <button className="btn-danger btn-sm" onClick={onDelete} title="Hapus catatan">🗑</button>
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
    if (!namaPengawas.trim()) {
      toast.error('Nama pengawas wajib diisi')
      return
    }
    const count = Math.min(50, Math.max(1, parseInt(bulkCount) || 1))
    setGenerating(true)
    try {
      const generated = []
      for (let i = 0; i < count; i++) {
        const c = await generateSignedCode(tierKey)
        const record = {
          ...c,
          soldTo: namaPengawas.trim(),
          soldAt: Date.now(),
          status: 'aktif',
          note: note.trim()
        }
        addAdminCode(record)
        generated.push(record)
      }
      setResults(generated)
      toast.success(`${count} kode berhasil diterbitkan untuk ${namaPengawas.trim()}`)
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
            <button className="btn-primary" onClick={() => { onSaved() }}>Selesai</button>
          </>
        }
      >
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3 mb-3">
          ✅ {results.length} kode berhasil dibuat untuk <strong>{results[0]?.soldTo}</strong>. Salin & kirim kode ke pengawas.
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
        <div className="bg-toska-50 border border-toska-200 rounded p-3 text-xs text-toska-900">
          💡 Kode ditandatangani offline pakai HMAC-SHA256. Bisa diaktivasi tanpa internet di browser pengawas.
        </div>

        <div>
          <label className="label">Nama Pengawas <span className="text-rose-500">*</span></label>
          <input
            className="input"
            value={namaPengawas}
            onChange={(e) => setNamaPengawas(e.target.value)}
            placeholder="Nama lengkap pengawas"
            required
          />
          <p className="text-[10px] text-slate-500 mt-1">Wajib diisi — akan tercatat sebagai pemilik kode</p>
        </div>

        <div>
          <label className="label">Tier / Jenis Lisensi</label>
          <div className="grid grid-cols-1 gap-2">
            {TIER_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${tierKey === opt.key ? 'border-navy-900 bg-navy-50' : 'border-slate-200 hover:border-slate-300'}`}
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
                    {opt.expiryDays > 0 ? `Berlaku ${opt.expiryDays} hari sejak aktivasi` : 'Lifetime — tidak ada expired'}
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
            <label className="label">Catatan (opsional)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. KKMA 04 batch Juni 2026"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
