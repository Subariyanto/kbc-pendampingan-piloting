import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
import {
  listActivationCodes,
  createActivationCode,
  deleteActivationCode,
  resetActivationCode
} from '../lib/repository.js'

const ROLE_LABEL = {
  admin: 'Admin (Ketua Pokjawas)',
  pengawas: 'Pengawas Madrasah',
  kepala: 'Kepala Madrasah',
  viewer: 'Viewer (Read Only)'
}

const ROLE_TONES = {
  admin: 'bg-amber-100 text-amber-900 border-amber-200',
  pengawas: 'bg-toska-100 text-toska-900 border-toska-200',
  kepala: 'bg-navy-100 text-navy-900 border-navy-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200'
}

// Generate kode random: KBC-XXXX-YYYY
function generateRandomCode(prefix = 'KBC') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}-${seg(4)}-${seg(4)}`
}

export default function KodeAktivasiPage() {
  const { state } = useData()
  const toast = useToast()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'unused' | 'used'
  const [filterRole, setFilterRole] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await listActivationCodes()
      setCodes(list)
    } catch (err) {
      toast.error('Gagal load kode: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!SUPABASE_ENABLED) { setLoading(false); return }
    refresh()
  }, [])

  const filtered = useMemo(() => {
    return codes.filter((c) => {
      if (filterStatus === 'used' && !c.used) return false
      if (filterStatus === 'unused' && c.used) return false
      if (filterRole !== 'all' && c.role !== filterRole) return false
      if (search) {
        const q = search.toLowerCase()
        return c.code.toLowerCase().includes(q) || (c.nama || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [codes, filterStatus, filterRole, search])

  const stats = useMemo(() => ({
    total: codes.length,
    used: codes.filter((c) => c.used).length,
    unused: codes.filter((c) => !c.used).length,
    byRole: codes.reduce((acc, c) => {
      acc[c.role] = (acc[c.role] || 0) + 1
      return acc
    }, {})
  }), [codes])

  const onCopyCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success(`Kode ${code} disalin`))
      .catch(() => toast.error('Gagal menyalin'))
  }

  if (!SUPABASE_ENABLED) {
    return (
      <>
        <PageHeader title="Kelola Kode Aktivasi" icon="🎫" />
        <div className="card-pad">
          <p className="text-sm text-slate-700">
            Manajemen kode aktivasi hanya tersedia di mode Supabase. Aktifkan koneksi Supabase di settings.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Kelola Kode Aktivasi"
        description="Terbitkan kode aktivasi untuk pengawas, kepala madrasah, atau viewer. User pakai kode ini untuk daftar tanpa email."
        icon="🎫"
        actions={
          <>
            <button className="btn-ghost" onClick={refresh} disabled={loading}>
              {loading ? 'Memuat…' : '↻ Refresh'}
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              ＋ Terbitkan Kode
            </button>
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
          <p className="text-xs text-slate-500">Belum Dipakai</p>
          <p className="text-2xl font-bold text-toska-700">{stats.unused}</p>
        </div>
        <div className="card-pad">
          <p className="text-xs text-slate-500">Sudah Dipakai</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.used}</p>
        </div>
        <div className="card-pad">
          <p className="text-xs text-slate-500">Per Role</p>
          <p className="text-xs text-slate-700 mt-1 leading-tight">
            {Object.entries(stats.byRole).map(([r, n]) => (
              <span key={r} className="inline-block mr-2">
                <span className="font-medium capitalize">{r}</span>: {n}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card-pad mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="🔍 Cari kode atau nama…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua status</option>
            <option value="unused">Belum dipakai</option>
            <option value="used">Sudah dipakai</option>
          </select>
          <select className="input" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Semua role</option>
            <option value="admin">Admin</option>
            <option value="pengawas">Pengawas</option>
            <option value="kepala">Kepala Madrasah</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat daftar kode…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={codes.length === 0 ? 'Belum ada kode aktivasi' : 'Tidak ada kode yang cocok'}
            description={codes.length === 0
              ? 'Klik "Terbitkan Kode" untuk membuat kode aktivasi pertama.'
              : 'Coba ubah filter atau kata kunci.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Untuk (Nama)</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Dibuat</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CodeRow
                    key={c.id}
                    code={c}
                    onCopy={() => onCopyCode(c.code)}
                    onDelete={() => setConfirmDelete(c)}
                    onReset={async () => {
                      try {
                        await resetActivationCode(c.id)
                        toast.success('Kode di-reset, bisa dipakai lagi')
                        await refresh()
                      } catch (err) {
                        toast.error('Gagal reset: ' + err.message)
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <CreateCodeModal
          pengawasList={state.pengawas}
          madrasahList={state.madrasah}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false)
            await refresh()
          }}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Hapus Kode Aktivasi"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button
                className="btn-danger"
                onClick={async () => {
                  try {
                    await deleteActivationCode(confirmDelete.id)
                    toast.success('Kode dihapus')
                    setConfirmDelete(null)
                    await refresh()
                  } catch (err) {
                    toast.error('Gagal hapus: ' + err.message)
                  }
                }}
              >
                Hapus
              </button>
            </>
          }
        >
          <p className="text-sm">
            Yakin menghapus kode <strong className="font-mono">{confirmDelete.code}</strong>?
          </p>
          {confirmDelete.used && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Kode ini sudah dipakai. Akun user yang terdaftar tidak akan terhapus, tapi kode tidak akan ada lagi di daftar.
            </p>
          )}
        </Modal>
      )}
    </>
  )
}

function CodeRow({ code, onCopy, onDelete, onReset }) {
  return (
    <tr>
      <td>
        <button onClick={onCopy} className="font-mono text-sm font-semibold text-navy-900 hover:text-toska-700 cursor-pointer flex items-center gap-1" title="Klik untuk salin">
          <span>{code.code}</span>
          <span className="text-xs">📋</span>
        </button>
        {code.note && <p className="text-xs text-slate-500 mt-0.5">{code.note}</p>}
      </td>
      <td>
        <p className="font-medium text-navy-900">{code.nama}</p>
      </td>
      <td>
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${ROLE_TONES[code.role] || ROLE_TONES.viewer}`}>
          {ROLE_LABEL[code.role] || code.role}
        </span>
      </td>
      <td>
        {code.used ? (
          <div>
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-medium">
              ✓ Dipakai
            </span>
            {code.usedAt && (
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(code.usedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded bg-toska-100 text-toska-800 text-xs font-medium">
            ⌛ Tersedia
          </span>
        )}
      </td>
      <td className="text-xs text-slate-500">
        {code.createdAt ? new Date(code.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
      </td>
      <td className="text-right whitespace-nowrap">
        {code.used && (
          <button className="btn-ghost btn-sm mr-1" onClick={onReset} title="Reset (kode bisa dipakai lagi)">
            ↺
          </button>
        )}
        <button className="btn-danger btn-sm" onClick={onDelete} title="Hapus kode">✕</button>
      </td>
    </tr>
  )
}

function CreateCodeModal({ pengawasList, madrasahList, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    code: generateRandomCode(),
    role: 'pengawas',
    nama: '',
    pengawasId: '',
    madrasahId: '',
    note: ''
  })
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkCount, setBulkCount] = useState(5)
  const [saving, setSaving] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const onRegenerate = () => {
    setForm({ ...form, code: generateRandomCode() })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      toast.error('Nama wajib diisi (untuk identifikasi pemilik kode)')
      return
    }
    if (form.role === 'pengawas' && !form.pengawasId) {
      toast.error('Pilih pengawas terkait')
      return
    }
    if (form.role === 'kepala' && !form.madrasahId) {
      toast.error('Pilih madrasah terkait')
      return
    }

    setSaving(true)
    try {
      if (bulkMode) {
        const count = Math.min(50, Math.max(1, parseInt(bulkCount) || 1))
        let successCount = 0
        for (let i = 0; i < count; i++) {
          try {
            await createActivationCode({
              code: generateRandomCode(),
              role: form.role,
              nama: count > 1 ? `${form.nama} ${i + 1}` : form.nama,
              pengawasId: form.pengawasId || null,
              madrasahId: form.madrasahId || null,
              note: form.note
            })
            successCount++
          } catch (err) {
            console.error('Bulk create error:', err)
          }
        }
        toast.success(`${successCount}/${count} kode berhasil dibuat`)
      } else {
        await createActivationCode({
          code: form.code,
          role: form.role,
          nama: form.nama,
          pengawasId: form.pengawasId || null,
          madrasahId: form.madrasahId || null,
          note: form.note
        })
        toast.success('Kode aktivasi diterbitkan')
      }
      await onSaved()
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Terbitkan Kode Aktivasi"
      footer={
        <>
          <button className="btn-ghost" type="button" onClick={onClose}>Batal</button>
          <button className="btn-primary" type="submit" form="codeForm" disabled={saving}>
            {saving ? 'Menerbitkan…' : (bulkMode ? `Terbitkan ${bulkCount} Kode` : 'Terbitkan')}
          </button>
        </>
      }
    >
      <form id="codeForm" onSubmit={onSubmit} className="space-y-3">
        <div className="bg-toska-50 border border-toska-200 rounded p-3 text-xs text-toska-900">
          ℹ️ User pakai kode ini di halaman aktivasi → akun otomatis dibuat dengan role yang dipilih, langsung login. Tidak perlu email/password.
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setBulkMode(false)}
            className={`flex-1 py-2 rounded border ${!bulkMode ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            Satu Kode
          </button>
          <button
            type="button"
            onClick={() => setBulkMode(true)}
            className={`flex-1 py-2 rounded border ${bulkMode ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            Bulk (banyak kode)
          </button>
        </div>

        {!bulkMode && (
          <div>
            <label className="label">Kode Aktivasi</label>
            <div className="flex gap-2">
              <input
                className="input font-mono uppercase tracking-wider flex-1"
                value={form.code}
                onChange={update('code')}
                placeholder="KBC-XXXX-XXXX"
                required
              />
              <button type="button" className="btn-ghost" onClick={onRegenerate} title="Generate kode baru">
                🎲
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Klik 🎲 untuk generate kode random, atau ketik manual.</p>
          </div>
        )}

        {bulkMode && (
          <div>
            <label className="label">Jumlah Kode</label>
            <input
              className="input"
              type="number"
              min="1"
              max="50"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Maks 50 kode sekaligus. Setiap kode di-generate random.</p>
          </div>
        )}

        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={update('role')}>
            <option value="admin">Admin (Ketua Pokjawas)</option>
            <option value="pengawas">Pengawas Madrasah</option>
            <option value="kepala">Kepala Madrasah</option>
            <option value="viewer">Viewer (Read Only)</option>
          </select>
        </div>

        <div>
          <label className="label">{bulkMode ? 'Nama Dasar (akan diberi suffix #1, #2, …)' : 'Nama Pemilik Kode'}</label>
          <input
            className="input"
            value={form.nama}
            onChange={update('nama')}
            placeholder={bulkMode ? 'mis. Pengawas Batch Juli 2026' : 'mis. Drs. H. Ahmad Fauzi, M.Pd'}
            required
          />
        </div>

        {form.role === 'pengawas' && (
          <div>
            <label className="label">Pengawas Terkait (data master)</label>
            <select className="input" value={form.pengawasId} onChange={update('pengawasId')} required>
              <option value="">— pilih —</option>
              {pengawasList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} {p.nip && `(${p.nip})`}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">User yang aktivasi akan otomatis terhubung ke pengawas ini.</p>
          </div>
        )}

        {form.role === 'kepala' && (
          <div>
            <label className="label">Madrasah Terkait</label>
            <select className="input" value={form.madrasahId} onChange={update('madrasahId')} required>
              <option value="">— pilih —</option>
              {madrasahList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama} ({m.jenjang})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">User yang aktivasi akan otomatis terhubung ke madrasah ini.</p>
          </div>
        )}

        <div>
          <label className="label">Catatan (opsional)</label>
          <input
            className="input"
            value={form.note}
            onChange={update('note')}
            placeholder="mis. Untuk Bapak Fauzi, KKMA 04"
          />
        </div>
      </form>
    </Modal>
  )
}