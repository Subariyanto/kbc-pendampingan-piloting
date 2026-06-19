import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
import {
  listUsers,
  createUser,
  updateUserProfile,
  deleteUser
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

export default function PenggunaPage() {
  const { state } = useData()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await listUsers()
      setUsers(list)
    } catch (err) {
      toast.error('Gagal load user: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      setLoading(false)
      return
    }
    refresh()
  }, [])

  if (!SUPABASE_ENABLED) {
    return (
      <>
        <PageHeader title="Kelola Pengguna" icon="👥" />
        <div className="card-pad">
          <p className="text-sm text-slate-700">
            Manajemen pengguna hanya tersedia di mode Supabase. Mode lokal pakai user demo bawaan.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Buat akun login untuk pengawas, kepala madrasah, atau viewer."
        icon="👥"
        actions={
          <>
            <button className="btn-ghost" onClick={refresh} disabled={loading}>
              {loading ? 'Memuat…' : '↻ Refresh'}
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              ＋ Tambah Pengguna
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat daftar pengguna…</div>
        ) : users.length === 0 ? (
          <EmptyState title="Belum ada pengguna" description="Tambahkan pengguna baru untuk memulai." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Nama / Email</th>
                  <th>Role</th>
                  <th>Pengawas / Madrasah</th>
                  <th>Login Terakhir</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    pengawasList={state.pengawas}
                    madrasahList={state.madrasah}
                    onEdit={() => setEditing(u)}
                    onDelete={() => setConfirmDelete(u)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <UserFormModal
          mode={creating ? 'create' : 'edit'}
          initial={editing}
          pengawasList={state.pengawas}
          madrasahList={state.madrasah}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={async () => {
            setCreating(false)
            setEditing(null)
            await refresh()
          }}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Hapus Pengguna"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button
                className="btn-danger"
                onClick={async () => {
                  try {
                    await deleteUser(confirmDelete.id)
                    toast.success('Pengguna dihapus')
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
            Yakin menghapus pengguna <strong>{confirmDelete.nama || confirmDelete.email}</strong>?
            Tindakan ini tidak bisa dibatalkan.
          </p>
        </Modal>
      )}
    </>
  )
}

function UserRow({ user, pengawasList, madrasahList, onEdit, onDelete }) {
  const linkedName = useMemo(() => {
    if (user.role === 'pengawas' && user.pengawasId) {
      return pengawasList.find((p) => p.id === user.pengawasId)?.nama || '(tidak ditemukan)'
    }
    if (user.role === 'kepala' && user.madrasahId) {
      return madrasahList.find((m) => m.id === user.madrasahId)?.nama || '(tidak ditemukan)'
    }
    return '—'
  }, [user, pengawasList, madrasahList])

  return (
    <tr>
      <td>
        <p className="font-medium text-navy-900">{user.nama || '(belum diisi)'}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </td>
      <td>
        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${ROLE_TONES[user.role] || ROLE_TONES.viewer}`}>
          {ROLE_LABEL[user.role] || user.role}
        </span>
      </td>
      <td className="text-sm">{linkedName}</td>
      <td className="text-xs text-slate-500">
        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('id-ID') : 'Belum pernah'}
      </td>
      <td className="text-right whitespace-nowrap">
        <button className="btn-ghost btn-sm mr-1" onClick={onEdit}>✎</button>
        <button className="btn-danger btn-sm" onClick={onDelete}>✕</button>
      </td>
    </tr>
  )
}

function UserFormModal({ mode, initial, pengawasList, madrasahList, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    email: initial?.email || '',
    password: '',
    nama: initial?.nama || '',
    role: initial?.role || 'pengawas',
    pengawasId: initial?.pengawasId || '',
    madrasahId: initial?.madrasahId || ''
  }))
  const [saving, setSaving] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'create') {
      if (!form.email || !form.password) {
        toast.error('Email dan password wajib diisi')
        return
      }
      if (form.password.length < 8) {
        toast.error('Password minimal 8 karakter')
        return
      }
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
      if (mode === 'create') {
        await createUser({
          email: form.email,
          password: form.password,
          nama: form.nama,
          role: form.role,
          pengawasId: form.pengawasId || null,
          madrasahId: form.madrasahId || null
        })
        toast.success('Pengguna baru dibuat')
      } else {
        await updateUserProfile({
          id: initial.id,
          nama: form.nama,
          role: form.role,
          pengawasId: form.pengawasId || null,
          madrasahId: form.madrasahId || null
        })
        toast.success('Profil pengguna diperbarui')
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
      title={mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
      footer={
        <>
          <button className="btn-ghost" type="button" onClick={onClose}>Batal</button>
          <button className="btn-primary" type="submit" form="userForm" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="userForm" onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Email login</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={update('email')}
            disabled={mode === 'edit'}
            placeholder="contoh@gmail.com"
            required
          />
        </div>
        {mode === 'create' && (
          <div className="sm:col-span-2">
            <label className="label">Password awal</label>
            <input
              className="input font-mono"
              type="text"
              value={form.password}
              onChange={update('password')}
              placeholder="Minimal 8 karakter"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Kirim password ini ke pengguna lewat WA/email. Pengguna bisa ganti sendiri nanti.
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Nama lengkap</label>
          <input className="input" value={form.nama} onChange={update('nama')} placeholder="Nama yang ditampilkan" />
        </div>
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
          {form.role === 'pengawas' && (
            <>
              <label className="label">Pengawas terkait</label>
              <select className="input" value={form.pengawasId} onChange={update('pengawasId')} required>
                <option value="">— pilih —</option>
                {pengawasList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} {p.kkma && `(${p.kkma})`}</option>
                ))}
              </select>
            </>
          )}
          {form.role === 'kepala' && (
            <>
              <label className="label">Madrasah terkait</label>
              <select className="input" value={form.madrasahId} onChange={update('madrasahId')} required>
                <option value="">— pilih —</option>
                {madrasahList.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama} ({m.jenjang})</option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="sm:col-span-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-3">
          <p><strong>Tip Role:</strong></p>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li><strong>Admin</strong>: full akses. Cuma untuk Ketua Pokjawas.</li>
            <li><strong>Pengawas</strong>: edit data madrasah binaannya saja.</li>
            <li><strong>Kepala</strong>: lihat data madrasahnya + upload eviden.</li>
            <li><strong>Viewer</strong>: read-only, untuk pengamat/observer.</li>
          </ul>
        </div>
      </form>
    </Modal>
  )
}
