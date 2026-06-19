// Repository layer: bridge antara struktur state lokal (camelCase) <-> Supabase (snake_case).
// Tujuan: bisa load full snapshot ke React state, lalu writes di-mirror ke Supabase.

import { supabase } from './supabase.js'

// ----- Mappers DB → State -----
const mapPengawas = (r) => ({ id: r.id, nama: r.nama, nip: r.nip, pangkat: r.pangkat, jabatan: r.jabatan, wilayah: r.wilayah, hp: r.hp, email: r.email })
const mapMadrasah = (r) => ({
  id: r.id, nama: r.nama, nsm: r.nsm, npsn: r.npsn, jenjang: r.jenjang,
  statusNS: r.status_ns, kecamatan: r.kecamatan, kepala: r.kepala,
  hp: r.hp, email: r.email, pengawasId: r.pengawas_id,
  tahunPelajaran: r.tahun_pelajaran, statusPiloting: r.status_piloting, catatan: r.catatan
})
const mapJadwal = (r) => ({
  id: r.id, tanggal: r.tanggal, madrasahId: r.madrasah_id, pengawasId: r.pengawas_id,
  bentuk: r.bentuk, materi: r.materi, tempat: r.tempat, status: r.status, catatan: r.catatan
})
const mapPendampingan = (r) => ({
  id: r.id, tanggal: r.tanggal, madrasahId: r.madrasah_id, pengawasId: r.pengawas_id,
  kegiatan: r.kegiatan, temuanPositif: r.temuan_positif, kendala: r.kendala,
  observasi: r.observasi, rekomendasi: r.rekomendasi, rencanaTindakLanjut: r.rencana_tindak_lanjut,
  batasTL: r.batas_tl, statusTL: r.status_tl, buktiLink: r.bukti_link, skor: r.skor || {}
})
const mapEviden = (r) => ({
  id: r.id, madrasahId: r.madrasah_id, jenis: r.jenis, judul: r.judul,
  deskripsi: r.deskripsi, tanggal: r.tanggal, link: r.link
})
const mapTL = (r) => ({
  id: r.id, madrasahId: r.madrasah_id, temuan: r.temuan, rekomendasi: r.rekomendasi,
  pj: r.pj, batas: r.batas, status: r.status, catatan: r.catatan
})
const mapAspek = (a, indikator = []) => ({
  id: a.id, kode: a.kode, nama: a.nama,
  indikator: indikator
    .filter((i) => i.aspek_id === a.id)
    .sort((x, y) => x.nomor - y.nomor)
    .map((i) => ({ id: i.id, nomor: i.nomor, teks: i.teks }))
})
const mapSettings = (r) => ({
  namaInstansi: r.nama_instansi, subInstansi: r.sub_instansi,
  tahunPelajaran: r.tahun_pelajaran, ketuaPokjawas: r.ketua_pokjawas,
  nipKetua: r.nip_ketua, logoDataUrl: r.logo_url || '',
  bobot: r.bobot || { perencanaan: 20, pelaksanaan: 20, budaya: 20, panca: 20, evaluasi: 20 }
})

// ----- Mappers State → DB -----
const dbMadrasah = (m) => ({
  id: m.id, nama: m.nama, nsm: m.nsm, npsn: m.npsn, jenjang: m.jenjang,
  status_ns: m.statusNS, kecamatan: m.kecamatan, kepala: m.kepala,
  hp: m.hp, email: m.email, pengawas_id: m.pengawasId || null,
  tahun_pelajaran: m.tahunPelajaran, status_piloting: m.statusPiloting, catatan: m.catatan
})
const dbPengawas = (p) => ({ id: p.id, nama: p.nama, nip: p.nip, pangkat: p.pangkat, jabatan: p.jabatan, wilayah: p.wilayah, hp: p.hp, email: p.email })
const dbJadwal = (j) => ({
  id: j.id, tanggal: j.tanggal, madrasah_id: j.madrasahId, pengawas_id: j.pengawasId || null,
  bentuk: j.bentuk, materi: j.materi, tempat: j.tempat, status: j.status, catatan: j.catatan
})
const dbPendampingan = (p) => ({
  id: p.id, tanggal: p.tanggal, madrasah_id: p.madrasahId, pengawas_id: p.pengawasId || null,
  kegiatan: p.kegiatan, temuan_positif: p.temuanPositif, kendala: p.kendala,
  observasi: p.observasi, rekomendasi: p.rekomendasi, rencana_tindak_lanjut: p.rencanaTindakLanjut,
  batas_tl: p.batasTL || null, status_tl: p.statusTL, bukti_link: p.buktiLink, skor: p.skor || {}
})
const dbEviden = (e) => ({
  id: e.id, madrasah_id: e.madrasahId, jenis: e.jenis, judul: e.judul,
  deskripsi: e.deskripsi, tanggal: e.tanggal, link: e.link
})
const dbTL = (t) => ({
  id: t.id, madrasah_id: t.madrasahId, temuan: t.temuan, rekomendasi: t.rekomendasi,
  pj: t.pj, batas: t.batas || null, status: t.status, catatan: t.catatan
})
const dbSettings = (s) => ({
  id: 1,
  nama_instansi: s.namaInstansi, sub_instansi: s.subInstansi,
  tahun_pelajaran: s.tahunPelajaran, ketua_pokjawas: s.ketuaPokjawas,
  nip_ketua: s.nipKetua, logo_url: s.logoDataUrl || null, bobot: s.bobot
})

const collectionConfig = {
  madrasah: { table: 'madrasah', toDb: dbMadrasah, key: 'madrasah' },
  pengawas: { table: 'pengawas', toDb: dbPengawas, key: 'pengawas' },
  jadwal: { table: 'jadwal', toDb: dbJadwal, key: 'jadwal' },
  pendampingan: { table: 'pendampingan', toDb: dbPendampingan, key: 'pendampingan' },
  eviden: { table: 'eviden', toDb: dbEviden, key: 'eviden' },
  tindakLanjut: { table: 'tindak_lanjut', toDb: dbTL, key: 'tindakLanjut' }
}

// ----- API -----
export async function loadSnapshot() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const [
    settingsRes, aspekRes, indRes, pengawasRes, madrasahRes,
    jadwalRes, pendampinganRes, evidenRes, tlRes
  ] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('instrumen_aspek').select('*').order('urutan'),
    supabase.from('instrumen_indikator').select('*'),
    supabase.from('pengawas').select('*').order('nama'),
    supabase.from('madrasah').select('*').order('nama'),
    supabase.from('jadwal').select('*').order('tanggal', { ascending: false }),
    supabase.from('pendampingan').select('*').order('tanggal', { ascending: false }),
    supabase.from('eviden').select('*').order('tanggal', { ascending: false }),
    supabase.from('tindak_lanjut').select('*').order('batas')
  ])

  const errors = [settingsRes, aspekRes, indRes, pengawasRes, madrasahRes, jadwalRes, pendampinganRes, evidenRes, tlRes]
    .map((r) => r.error).filter(Boolean)
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '))
  }

  return {
    settings: settingsRes.data ? mapSettings(settingsRes.data) : null,
    instrumen: (aspekRes.data || []).map((a) => mapAspek(a, indRes.data || [])),
    pengawas: (pengawasRes.data || []).map(mapPengawas),
    madrasah: (madrasahRes.data || []).map(mapMadrasah),
    jadwal: (jadwalRes.data || []).map(mapJadwal),
    pendampingan: (pendampinganRes.data || []).map(mapPendampingan),
    eviden: (evidenRes.data || []).map(mapEviden),
    tindakLanjut: (tlRes.data || []).map(mapTL),
    users: [] // user dikelola Supabase Auth
  }
}

export async function upsertItem(collection, item) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const cfg = collectionConfig[collection]
  if (!cfg) throw new Error(`Unknown collection ${collection}`)
  const payload = cfg.toDb(item)
  // Hapus id kalau bukan UUID valid (mode insert pakai uid lokal)
  if (payload.id && !isUuid(payload.id)) delete payload.id
  if (!payload.id) delete payload.id
  const { data, error } = await supabase.from(cfg.table).upsert(payload).select().single()
  if (error) throw error
  return data
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''))
}

export async function deleteItem(collection, id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const cfg = collectionConfig[collection]
  if (!cfg) throw new Error(`Unknown collection ${collection}`)
  const { error } = await supabase.from(cfg.table).delete().eq('id', id)
  if (error) throw error
}

export async function updateSettingsRemote(patch) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const { error } = await supabase.from('settings').update(dbSettings(patch)).eq('id', 1)
  if (error) throw error
}

// Replace instrumen wholesale (dipakai untuk reset/edit)
export async function replaceInstrumen(instrumen) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  // delete all then insert (simple strategy)
  await supabase.from('instrumen_indikator').delete().not('id', 'is', null)
  await supabase.from('instrumen_aspek').delete().not('id', 'is', null)
  for (let i = 0; i < instrumen.length; i++) {
    const a = instrumen[i]
    const { data: aspek, error: e1 } = await supabase
      .from('instrumen_aspek')
      .insert({ kode: a.kode, nama: a.nama, urutan: i + 1 })
      .select()
      .single()
    if (e1) throw e1
    if (a.indikator?.length) {
      const rows = a.indikator.map((ind, idx) => ({ aspek_id: aspek.id, nomor: idx + 1, teks: ind.teks }))
      const { error: e2 } = await supabase.from('instrumen_indikator').insert(rows)
      if (e2) throw e2
    }
  }
}

// Push entire local snapshot ke Supabase (one-shot migration)
export async function pushFullSnapshot(state) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  // settings
  if (state.settings) await updateSettingsRemote(state.settings)
  // instrumen
  if (state.instrumen?.length) await replaceInstrumen(state.instrumen)
  // pengawas
  if (state.pengawas?.length) {
    const rows = state.pengawas.map(dbPengawas)
    await supabase.from('pengawas').delete().not('id', 'is', null)
    const { error } = await supabase.from('pengawas').insert(rows)
    if (error) throw error
  }
  // madrasah
  if (state.madrasah?.length) {
    const rows = state.madrasah.map(dbMadrasah)
    await supabase.from('madrasah').delete().not('id', 'is', null)
    const { error } = await supabase.from('madrasah').insert(rows)
    if (error) throw error
  }
  // jadwal, pendampingan, eviden, tl (cascade dari madrasah delete sudah hapus child)
  for (const [key, mapper] of [
    ['jadwal', dbJadwal],
    ['pendampingan', dbPendampingan],
    ['eviden', dbEviden]
  ]) {
    const list = state[key] || []
    if (list.length) {
      const { error } = await supabase.from(collectionConfig[key].table).insert(list.map(mapper))
      if (error) throw error
    }
  }
  if (state.tindakLanjut?.length) {
    const { error } = await supabase.from('tindak_lanjut').insert(state.tindakLanjut.map(dbTL))
    if (error) throw error
  }
}

// =============================================================================
// User Management (admin only)
// =============================================================================

export async function listUsers() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const { data, error } = await supabase.rpc('admin_users_list')
  if (error) throw error
  return (data || []).map((u) => ({
    id: u.id,
    email: u.email,
    nama: u.nama,
    role: u.role,
    pengawasId: u.pengawas_id,
    madrasahId: u.madrasah_id,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at
  }))
}

export async function createUser({ email, password, nama, role, pengawasId, madrasahId }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  // signUp ngga butuh ditelan oleh user baru — kita simpan session admin lalu restore setelahnya
  const { data: adminSession } = await supabase.auth.getSession()
  const adminAccess = adminSession?.session?.access_token
  const adminRefresh = adminSession?.session?.refresh_token

  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim(),
    password,
    options: {
      data: {
        nama: nama || '',
        role: role || 'viewer',
        pengawas_id: pengawasId || '',
        madrasah_id: madrasahId || ''
      }
    }
  })
  if (error) throw error

  if (adminAccess && adminRefresh) {
    await supabase.auth.setSession({ access_token: adminAccess, refresh_token: adminRefresh })
  }
  return data?.user
}

export async function updateUserProfile({ id, nama, role, pengawasId, madrasahId }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const { error } = await supabase.rpc('admin_update_profile', {
    target_id: id,
    new_nama: nama || null,
    new_role: role,
    new_pengawas_id: pengawasId || null,
    new_madrasah_id: madrasahId || null
  })
  if (error) throw error
}

export async function deleteUser(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  const { error } = await supabase.rpc('admin_delete_user', { target_id: id })
  if (error) throw error
}

// Diagnostic: validasi auth + RLS dengan insert+delete real ke tabel madrasah
export async function runDiagnostic() {
  if (!supabase) return { ok: false, step: 'init', message: 'Supabase belum dikonfigurasi' }
  const log = []
  try {
    const { data: userData, error: ue } = await supabase.auth.getUser()
    if (ue || !userData?.user) return { ok: false, step: 'auth', message: ue?.message || 'Tidak ada session aktif', log }
    log.push({ step: 'auth', user: userData.user.email })

    const { data: prof, error: pe } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle()
    if (pe) return { ok: false, step: 'profile_select', message: pe.message, log }
    if (!prof) return { ok: false, step: 'profile_missing', message: 'Profile tidak ditemukan untuk user ini', log }
    log.push({ step: 'profile', role: prof.role, nama: prof.nama })

    const { count: mc, error: me } = await supabase.from('madrasah').select('id', { count: 'exact', head: true })
    if (me) return { ok: false, step: 'madrasah_select', message: me.message, log }
    log.push({ step: 'madrasah_select', count: mc })

    const testNama = `__diagnostic_${Date.now()}`
    const { data: inserted, error: ie } = await supabase.from('madrasah')
      .insert({ nama: testNama, jenjang: 'MI', status_ns: 'Negeri' })
      .select()
      .single()
    if (ie) return { ok: false, step: 'madrasah_insert', message: ie.message, details: ie.details, hint: ie.hint, log }
    log.push({ step: 'madrasah_insert', id: inserted.id })

    const { error: de } = await supabase.from('madrasah').delete().eq('id', inserted.id)
    if (de) log.push({ step: 'cleanup_failed', message: de.message })
    else log.push({ step: 'cleanup', ok: true })

    return { ok: true, step: 'done', message: 'Semua test pass', log }
  } catch (err) {
    return { ok: false, step: 'exception', message: err.message, log }
  }
}

