// Hook untuk filter data sesuai role pengguna login
import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

export function useScope() {
  const { user } = useAuth()
  const { state } = useData()

  return useMemo(() => {
    const role = user?.role
    let madrasahIds = state.madrasah.map((m) => m.id)
    let pengawasIds = state.pengawas.map((p) => p.id)
    let isLinkedPengawas = false
    let isLinkedKepala = false
    if (role === 'pengawas') {
      const pengawasId = pengawasFromUser(user, state.pengawas)
      if (pengawasId) {
        // User pengawas yang ter-link ke record pengawas → filter ke madrasah binaan
        isLinkedPengawas = true
        madrasahIds = state.madrasah.filter((m) => m.pengawasId === pengawasId).map((m) => m.id)
        pengawasIds = [pengawasId]
      }
      // else: pengawas independen (mis. baru daftar via kode aktivasi) → akses penuh
    } else if (role === 'kepala') {
      const madrasahId = madrasahFromUser(user, state.madrasah)
      if (madrasahId) {
        isLinkedKepala = true
        madrasahIds = [madrasahId]
        pengawasIds = []
      }
      // else: kepala tanpa link → akses penuh juga
    }

    const filterByMadrasah = (rows) => {
      if (role === 'admin' || role === 'viewer') return rows
      if (role === 'pengawas' && !isLinkedPengawas) return rows
      if (role === 'kepala' && !isLinkedKepala) return rows
      return rows.filter((r) => (r.madrasahId ? madrasahIds.includes(r.madrasahId) : true))
    }

    return {
      role,
      user,
      madrasahIds,
      pengawasIds,
      canEdit: role === 'admin' || role === 'pengawas',
      // Pengawas dapat akses penuh utk input/edit data (madrasah, pendampingan, eviden, dst).
      // Khusus admin: ditambahi akses panel admin (Pengguna, Lisensi, dll) di sidebar.
      canEditFull: role === 'admin' || role === 'pengawas',
      isViewer: role === 'viewer',
      filterByMadrasah,
      madrasah: state.madrasah.filter((m) => madrasahIds.includes(m.id)),
      pengawasList: state.pengawas.filter((p) => {
        if (role === 'admin' || role === 'viewer') return true
        if (role === 'pengawas' && !isLinkedPengawas) return true
        return pengawasIds.includes(p.id)
      }),
      jadwal: filterByMadrasah(state.jadwal),
      pendampingan: filterByMadrasah(state.pendampingan),
      eviden: filterByMadrasah(state.eviden),
      tindakLanjut: filterByMadrasah(state.tindakLanjut)
    }
  }, [user, state])
}

function pengawasFromUser(user, list) {
  if (!user) return null
  if (user.pengawasId && list.some((p) => p.id === user.pengawasId)) return user.pengawasId
  if (user.pengawasRef && list.some((p) => p.id === user.pengawasRef)) return user.pengawasRef
  // fallback by name match
  const byName = list.find((p) => p.nama === user.nama)
  return byName?.id ?? null
}

function madrasahFromUser(user, list) {
  if (!user) return null
  if (user.madrasahId && list.some((m) => m.id === user.madrasahId)) return user.madrasahId
  if (user.madrasahRef && list.some((m) => m.id === user.madrasahRef)) return user.madrasahRef
  const byName = list.find((m) => m.kepala === user.nama)
  return byName?.id ?? null
}
