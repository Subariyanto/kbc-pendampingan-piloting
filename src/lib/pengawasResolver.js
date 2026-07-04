/**
 * Helper untuk resolve data pengawas dari user yang sedang login
 * Digunakan di semua template cetak untuk mengisi tanda tangan otomatis
 */

/**
 * Cari pengawas yang match dengan user login
 * Priority:
 * 1. user.pengawasId (kalau ada mapping langsung)
 * 2. Match by nama (case-insensitive, partial match)
 * 3. Return virtual pengawas dari user data
 */
export function resolvePengawasFromUser(user, pengawasList = []) {
  if (!user) return null

  // 1. Kalau user punya pengawasId langsung
  if (user.pengawasId) {
    const found = pengawasList.find((p) => p.id === user.pengawasId)
    if (found) return found
  }

  // 2. Match by nama (case-insensitive)
  if (user.nama) {
    const userName = user.nama.toLowerCase()
    const found = pengawasList.find((p) => {
      const pengawasName = p.nama?.toLowerCase() || ''
      // Match kalau salah satu contains yang lain
      return pengawasName.includes(userName) || userName.includes(pengawasName)
    })
    if (found) return found
  }

  // 3. Return virtual pengawas dari user data
  return {
    id: user.id,
    nama: user.nama || user.username || '____________________',
    namaLengkap: user.namaLengkap || user.nama || '',
    nip: user.nip || '',
    pangkat: user.pangkat || '',
    jabatan: user.jabatan || 'Pengawas Pendamping',
    // Field lain kosong
    wilayah: '',
    hp: '',
    email: user.username || ''
  }
}
