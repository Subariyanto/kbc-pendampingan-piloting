// Helper Excel: download template + parse import untuk modul Madrasah Piloting
// ExcelJS di-lazy-load biar bundle utama tetap kecil.
import { JENJANG_OPTIONS, STATUS_NEGERI_SWASTA, STATUS_PILOTING } from './constants.js'

async function loadExcel() {
  const m = await import('exceljs')
  return m.default || m
}

const COLUMNS = [
  { key: 'nama', header: 'Nama Madrasah*', width: 35 },
  { key: 'nsm', header: 'NSM', width: 18 },
  { key: 'npsn', header: 'NPSN', width: 14 },
  { key: 'jenjang', header: 'Jenjang*', width: 10, listValues: JENJANG_OPTIONS },
  { key: 'statusNS', header: 'Status*', width: 10, listValues: STATUS_NEGERI_SWASTA },
  { key: 'kecamatan', header: 'Kecamatan', width: 18 },
  { key: 'kepala', header: 'Kepala Madrasah', width: 30 },
  { key: 'hp', header: 'No. HP', width: 16 },
  { key: 'email', header: 'Email', width: 26 },
  { key: 'pengawas', header: 'Pengawas Pendamping', width: 30 },
  { key: 'tahunPelajaran', header: 'Tahun Pelajaran', width: 14 },
  { key: 'statusPiloting', header: 'Status Piloting', width: 14, listValues: STATUS_PILOTING },
  { key: 'catatan', header: 'Catatan', width: 40 }
]

const SAMPLE_ROWS = [
  ['MTsN 1 Jember', '121135090001', '20581234', 'MTs', 'Negeri', 'Kaliwates', 'Dra. Hj. Siti Aminah, M.Ag', '081234567010', 'mtsn1@kemenagjember.go.id', 'Drs. H. Ahmad Fauzi, M.Pd', '2025/2026', 'Aktif', 'Madrasah piloting unggulan dengan dukungan komite kuat.'],
  ['MIN 2 Sukowono', '111135090002', '20581235', 'MI', 'Negeri', 'Sukowono', 'Hj. Nur Hayati, S.Pd.I, M.Pd', '081234567011', 'min2sukowono@kemenagjember.go.id', '', '2025/2026', 'Aktif', 'Sudah memiliki tim KBC dan SK pelaksana.']
]

export async function downloadMadrasahTemplate({ pengawasList = [], tahunPelajaran = '2025/2026' } = {}) {
  const ExcelJS = await loadExcel()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'KBC Pendampingan Piloting'
  wb.created = new Date()

  const ws = wb.addWorksheet('Data Madrasah', { views: [{ state: 'frozen', ySplit: 3 }] })

  // Title
  ws.mergeCells('A1', `${columnLetter(COLUMNS.length)}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = 'TEMPLAT IMPORT MADRASAH PILOTING — KBC Pokjawas Kemenag Jember'
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF102A4D' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 24

  // Sub-instruction
  ws.mergeCells('A2', `${columnLetter(COLUMNS.length)}2`)
  const subCell = ws.getCell('A2')
  subCell.value = 'Petunjuk: kolom bertanda * wajib diisi. Hapus baris contoh sebelum import. Kolom Pengawas Pendamping diisi nama persis seperti di Data Pengawas (kosongkan kalau belum ada).'
  subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  ws.getRow(2).height = 30

  // Header
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }))
  const headerRow = ws.getRow(3)
  COLUMNS.forEach((c, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = c.header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102A4D' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1F365D' } },
      bottom: { style: 'thin', color: { argb: 'FF1F365D' } },
      left: { style: 'thin', color: { argb: 'FF1F365D' } },
      right: { style: 'thin', color: { argb: 'FF1F365D' } }
    }
  })
  headerRow.height = 28
  headerRow.commit()

  // Sample rows + tahun pelajaran fallback
  SAMPLE_ROWS.forEach((row) => {
    const r = ws.addRow(row)
    r.font = { color: { argb: 'FF94A3B8' }, italic: true }
    r.commit()
  })

  // Tambah dropdown via data validation untuk kolom enum
  const lastRow = 200 // izinkan sampai 200 baris
  COLUMNS.forEach((c, idx) => {
    if (!c.listValues) return
    const col = columnLetter(idx + 1)
    ws.dataValidations.add(`${col}4:${col}${lastRow}`, {
      type: 'list',
      allowBlank: c.key !== 'jenjang' && c.key !== 'statusNS',
      formulae: [`"${c.listValues.join(',')}"`]
    })
  })

  // Sheet referensi pengawas
  if (pengawasList.length) {
    const refSheet = wb.addWorksheet('Referensi Pengawas')
    refSheet.columns = [
      { header: 'Nama', key: 'nama', width: 32 },
      { header: 'NIP', key: 'nip', width: 22 },
      { header: 'Wilayah Binaan', key: 'wilayah', width: 24 }
    ]
    refSheet.getRow(1).font = { bold: true }
    pengawasList.forEach((p) => refSheet.addRow({ nama: p.nama, nip: p.nip, wilayah: p.wilayah }))
  }

  // Sheet petunjuk
  const helpSheet = wb.addWorksheet('Petunjuk')
  const lines = [
    ['TEMPLAT IMPORT MADRASAH PILOTING'],
    [''],
    ['1. Sheet "Data Madrasah" → tempat input data. Hapus baris contoh berwarna abu-abu sebelum import.'],
    ['2. Kolom bertanda * wajib diisi. Kolom lain opsional.'],
    ['3. Kolom Jenjang: pilih dari dropdown ' + JENJANG_OPTIONS.join(' / ')],
    ['4. Kolom Status: pilih dari dropdown ' + STATUS_NEGERI_SWASTA.join(' / ')],
    ['5. Kolom Status Piloting: pilih dari dropdown ' + STATUS_PILOTING.join(' / ')],
    ['6. Kolom Pengawas Pendamping: tulis nama pengawas persis (lihat sheet "Referensi Pengawas").'],
    ['7. Tahun Pelajaran default: ' + tahunPelajaran + '. Boleh dikosongkan, akan otomatis diisi.'],
    ['8. NSM dan NPSN sebaiknya diisi sebagai TEKS (awali \' kalau angka panjang berubah jadi notasi ilmiah).'],
    ['9. Saat import:'],
    ['   - Kalau NSM cocok dengan data yang sudah ada → data lama di-UPDATE.'],
    ['   - Kalau tidak cocok → data baru ditambahkan.'],
    ['10. Format file: .xlsx. Maksimal 200 baris per import.']
  ]
  lines.forEach((line) => helpSheet.addRow(line))
  helpSheet.getColumn(1).width = 100
  helpSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF102A4D' } }

  // Buffer to file download
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `templat-import-madrasah-${new Date().toISOString().slice(0, 10)}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

export async function parseMadrasahImport(file) {
  if (!file) throw new Error('File tidak ditemukan')
  const ExcelJS = await loadExcel()
  const buf = await file.arrayBuffer()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  const ws = wb.getWorksheet('Data Madrasah') || wb.worksheets[0]
  if (!ws) throw new Error('Sheet "Data Madrasah" tidak ditemukan di file Excel')

  const rows = []
  const errors = []
  const seenNSM = new Set()

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 3) return // skip title (1), petunjuk (2), header (3)
    const obj = {}
    COLUMNS.forEach((c, idx) => {
      const cell = row.getCell(idx + 1)
      obj[c.key] = cellToString(cell?.value)
    })

    if (!obj.nama) {
      errors.push(`Baris ${rowNumber}: kolom Nama Madrasah wajib diisi`)
      return
    }
    if (!obj.jenjang) obj.jenjang = 'MI'
    else if (!JENJANG_OPTIONS.includes(obj.jenjang)) {
      errors.push(`Baris ${rowNumber}: Jenjang "${obj.jenjang}" tidak dikenal. Gunakan ${JENJANG_OPTIONS.join('/')}`)
      return
    }
    if (!obj.statusNS) obj.statusNS = 'Negeri'
    else if (!STATUS_NEGERI_SWASTA.includes(obj.statusNS)) {
      errors.push(`Baris ${rowNumber}: Status "${obj.statusNS}" tidak dikenal. Gunakan ${STATUS_NEGERI_SWASTA.join('/')}`)
      return
    }
    if (obj.statusPiloting && !STATUS_PILOTING.includes(obj.statusPiloting)) {
      errors.push(`Baris ${rowNumber}: Status Piloting "${obj.statusPiloting}" tidak dikenal. Gunakan ${STATUS_PILOTING.join('/')}`)
      return
    }
    if (!obj.statusPiloting) obj.statusPiloting = 'Aktif'

    if (obj.nsm) {
      if (seenNSM.has(obj.nsm)) {
        errors.push(`Baris ${rowNumber}: NSM ${obj.nsm} duplikat dalam file`)
      }
      seenNSM.add(obj.nsm)
    }

    rows.push({ rowNumber, ...obj })
  })

  return { rows, errors }
}

function cellToString(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if (value.text) return String(value.text).trim()
    if (value.result !== undefined) return String(value.result).trim()
    if (value.richText) return value.richText.map((r) => r.text).join('').trim()
    if (value.formula) return ''
    if (value instanceof Date) return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}

function columnLetter(n) {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
