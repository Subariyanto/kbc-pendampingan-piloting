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
    if (role === 'pengawas') {
      const pengawasId = pengawasFromUser(user, state.pengawas)
      madrasahIds = state.madrasah.filter((m) => m.pengawasId === pengawasId).map((m) => m.id)
      pengawasIds = pengawasId ? [pengawasId] : []
    } else if (role === 'kepala') {
      const madrasahId = madrasahFromUser(user, state.madrasah)
      madrasahIds = madrasahId ? [madrasahId] : []
      pengawasIds = []
    }

    const filterByMadrasah = (rows) => {
      if (role === 'admin' || role === 'viewer') return rows
      return rows.filter((r) => (r.madrasahId ? madrasahIds.includes(r.madrasahId) : true))
    }

    return {
      role,
      user,
      madrasahIds,
      pengawasIds,
      canEdit: role === 'admin' || role === 'pengawas',
      canEditFull: role === 'admin',
      isViewer: role === 'viewer',
      filterByMadrasah,
      madrasah: state.madrasah.filter((m) => madrasahIds.includes(m.id)),
      pengawasList: state.pengawas.filter((p) => role === 'admin' || role === 'viewer' ? true : pengawasIds.includes(p.id)),
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
