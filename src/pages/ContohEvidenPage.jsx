import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import { PrintHeaderMadrasah } from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { printPrintArea } from '../lib/printHelper.js'

const STORAGE_KEY = 'kbc_contoh_eviden_v2'
const KATEGORI_DEFAULT = [
  ['Dokumen Perencanaan', '📜', ['SK Tim KBC', 'Program Kerja KBC', 'Jadwal Kegiatan KBC']],
  ['Perangkat Ajar', '📖', ['Modul Ajar / RPP Memuat Nilai KBC']],
  ['Budaya Madrasah', '🏫', ['Tata Tertib Ramah Anak', 'Program Anti-Bullying']],
  ['Kegiatan Pembiasaan', '🌅', ['Dokumentasi Doa Bersama', 'Log Salam Pagi', 'Log Jumat Bersih']],
  ['Pembelajaran', '👨🏫', ['Dokumentasi Kelas', 'Jurnal Guru KBC', 'Hasil Observasi Pembelajaran']],
  ['Refleksi', '🪞', ['Notulen Rapat Refleksi', 'Catatan Tindak Lanjut']],
  ['Supervisi', '🔎', ['Instrumen Supervisi Kepala Madrasah', 'Instrumen Supervisi Pengawas']],
  ['Laporan', '📊', ['Laporan Pelaksanaan KBC', 'Laporan Rekomendasi']]
]
const loadData = () => { try { const x=JSON.parse(localStorage.getItem(STORAGE_KEY)); return x?.categories ? x : { categories: KATEGORI_DEFAULT.map(([name,icon,items])=>({id:`cat-${name}`,name,icon,items:items.map(judul=>({id:`item-${judul}`,judul,driveUrl:''}))})) } } catch { return {categories: KATEGORI_DEFAULT.map(([name,icon,items])=>({id:`cat-${name}`,name,icon,items:items.map(judul=>({id:`item-${judul}`,judul,driveUrl:''}))}))} } }
const validUrl = v => { if (!v) return true; try { return ['http:','https:'].includes(new URL(v).protocol) } catch { return false } }

export default function ContohEvidenPage() {
  const { state } = useData(); const toast=useToast(); const [data,setData]=useState(loadData); const [editing,setEditing]=useState(null); const [deleting,setDeleting]=useState(null); const [catForm,setCatForm]=useState(null); const [deletingCat,setDeletingCat]=useState(null); const [madrasahId,setMadrasahId]=useState(''); const [cetak,setCetak]=useState(new Date().toISOString().slice(0,10)); const [preview,setPreview]=useState(null); const madrasah=state.madrasah.find(m=>m.id===madrasahId)
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data)),[data])
  const saveItem=f=>{if(!f.judul.trim())return toast.error('Nama eviden wajib diisi.');if(!validUrl(f.driveUrl))return toast.error('Link harus URL valid.');setData(d=>({...d,categories:d.categories.map(c=>({...c,items:c.items.some(i=>i.id===f.id)?c.items.map(i=>i.id===f.id?{...i,...f,judul:f.judul.trim()}:i):c.id===f.categoryId?[...c.items,{...f,id:`item-${Date.now()}`,judul:f.judul.trim()}]:c.items}))}));setEditing(null);toast.success(f.id?'Eviden diperbarui.':'Eviden ditambahkan.')}
  const remove=()=>{setData(d=>({...d,categories:d.categories.map(c=>({...c,items:c.items.filter(i=>i.id!==deleting.id)}))}));setDeleting(null);toast.success('Eviden dihapus.')}
  const saveCat=f=>{if(!f.name.trim())return toast.error('Nama kategori wajib diisi.');setData(d=>({...d,categories:f.id?d.categories.map(c=>c.id===f.id?{...c,...f,name:f.name.trim()}:c):[...d.categories,{id:`cat-${Date.now()}`,name:f.name.trim(),icon:f.icon||'📁',items:[]}]}));setCatForm(null)}
  return <><PageHeader title="Contoh Eviden" icon="🗂️" description="Template eviden Implementasi KBC siap diisi, dicetak, atau diunduh PDF." actions={<div className="flex gap-2"><button className="btn-ghost" onClick={()=>setCatForm({name:'',icon:'📁'})}>＋ Kategori</button><button className="btn-primary" onClick={()=>setEditing({categoryId:data.categories[0]?.id,judul:'',driveUrl:''})}>＋ Tambah Eviden</button></div>}/>
    <div className="card-pad mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="label">Pilih Madrasah (untuk KOP dokumen)</label><select className="input" value={madrasahId} onChange={e=>setMadrasahId(e.target.value)}><option value="">— Pilih Madrasah —</option>{state.madrasah.map(m=><option key={m.id} value={m.id}>{m.nama}</option>)}</select></div><div><label className="label">Tanggal Dokumen</label><input className="input" type="date" value={cetak} onChange={e=>setCetak(e.target.value)}/></div></div>
    <div className="space-y-5">{data.categories.map(c=><section key={c.id} className="card-pad"><div className="flex justify-between mb-3"><h2 className="font-semibold text-navy-900">{c.icon} {c.name}</h2><div><button className="btn-ghost btn-sm" onClick={()=>setCatForm(c)}>✎ Kategori</button> <button className="btn-danger btn-sm" onClick={()=>setDeletingCat(c)}>Hapus</button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{c.items.map(i=><div key={i.id} className="border border-slate-200 rounded-lg p-4 flex flex-col"><p className="font-medium text-navy-900 flex-1">{i.judul}</p><p className="text-xs text-slate-500 my-2">Contoh format eviden KBC siap disesuaikan.</p><div className="flex gap-2"><button className="btn-primary flex-1" onClick={()=>setPreview({...i,kategori:c.name})}>👁 Lihat & Unduh</button>{i.driveUrl&&<a className="btn-ghost" href={i.driveUrl} target="_blank" rel="noreferrer">🔗 Drive</a>}</div><div className="mt-2"><button className="btn-ghost btn-sm" onClick={()=>setEditing({...i,categoryId:c.id})}>✎ Edit</button> <button className="btn-danger btn-sm" onClick={()=>setDeleting(i)}>Hapus</button></div></div>)}</div><button className="btn-ghost mt-3" onClick={()=>setEditing({categoryId:c.id,judul:'',driveUrl:''})}>＋ Tambah item</button></section>)}</div>
    {preview&&<TemplateModal item={preview} madrasah={madrasah} settings={state.settings} cetak={cetak} onClose={()=>setPreview(null)}/>}<EvidenForm item={editing} categories={data.categories} onClose={()=>setEditing(null)} onSave={saveItem}/><CategoryForm item={catForm} onClose={()=>setCatForm(null)} onSave={saveCat}/><ConfirmDialog open={Boolean(deleting)} onClose={()=>setDeleting(null)} onConfirm={remove} title="Hapus Eviden" message={`Yakin menghapus ${deleting?.judul||''}?`}/><ConfirmDialog open={Boolean(deletingCat)} onClose={()=>setDeletingCat(null)} onConfirm={()=>{setData(d=>({...d,categories:d.categories.filter(c=>c.id!==deletingCat.id)}));setDeletingCat(null);toast.success('Kategori dihapus.')}} title="Hapus Kategori" message={`Yakin menghapus kategori ${deletingCat?.name||''} beserta seluruh itemnya?`}/></>
}
function EvidenForm({item,categories,onClose,onSave}){const [f,setF]=useState(item||{});useEffect(()=>setF(item||{}),[item]);return <Modal open={Boolean(item)} onClose={onClose} title={item?.id?'Edit Eviden':'Tambah Eviden'} footer={<><button className="btn-ghost" onClick={onClose}>Batal</button><button className="btn-primary" onClick={()=>onSave(f)}>Simpan</button></>}><div className="space-y-3"><div><label className="label">Kategori</label><select className="input" value={f.categoryId||''} onChange={e=>setF({...f,categoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="label">Nama Eviden *</label><input className="input" value={f.judul||''} onChange={e=>setF({...f,judul:e.target.value})}/></div><div><label className="label">Link Google Drive</label><input className="input" value={f.driveUrl||''} onChange={e=>setF({...f,driveUrl:e.target.value})} placeholder="https://drive.google.com/..."/></div></div></Modal>}
function CategoryForm({item,onClose,onSave}){const [f,setF]=useState(item||{});useEffect(()=>setF(item||{}),[item]);return <Modal open={Boolean(item)} onClose={onClose} title="Edit Kategori" footer={<><button className="btn-ghost" onClick={onClose}>Batal</button><button className="btn-primary" onClick={()=>onSave(f)}>Simpan</button></>}><input className="input" value={f.name||''} onChange={e=>setF({...f,name:e.target.value})}/></Modal>}
function TemplateModal({ item, madrasah, settings, cetak, onClose }) {
 return <Modal open onClose={onClose} title={'Pratinjau ΓÇö ' + item.judul} size="xl" footer={<><button className="btn-ghost" onClick={onClose}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea({ title: item.judul })}>≡ƒû¿ Unduh / Cetak PDF</button></>}><div className="print-area bg-white p-6"><Template item={item} madrasah={madrasah} settings={settings} cetak={cetak}/></div></Modal>
}

function Template({ item, madrasah, settings, cetak }) {
  const nama = madrasah?.nama || '____________________'
  const ttd = <div style={{width:'45%', marginLeft:'55%'}} className="text-center mt-10"><p>{settings?.kabupaten || 'Jember'}, {tanggal(cetak)}</p><p>{item.kategori === 'Supervisi' ? 'Supervisor,' : 'Kepala Madrasah,'}</p><div style={{height:75}}/><p className="font-semibold underline">{madrasah?.kepala || '____________________'}</p><p>NIP. ____________________</p></div>
  const body = (() => { switch (item.judul) {
    case 'SK Tim KBC': return <SkTim nama={nama}/>
    case 'Program Kerja KBC': return <ProgramKerja nama={nama} tapel={settings?.tahunPelajaran} kab={settings?.kabupaten}/>
    case 'Jadwal Kegiatan KBC': return <JadwalKegiatan/>
    case 'Modul Ajar / RPP Memuat Nilai KBC': return <ModulAjar/>
    case 'Tata Tertib Ramah Anak': return <TataTertib nama={nama}/>
    case 'Program Anti-Bullying': return <AntiBullying nama={nama}/>
    case 'Dokumentasi Doa Bersama': return <LogSheet judul="Dokumentasi Doa Bersama" kolom={['Hari/Tanggal','Waktu','Uraian Doa','Pembina','Petugas','Dokumentasi Foto/Link']}/>
    case 'Log Salam Pagi': return <LogSheet judul="Log Salam Pagi" kolom={['Hari/Tanggal','Waktu','Petugas Piket','Jumlah Siswa Tersapa','Catatan','Dokumentasi Foto/Link']}/>
    case 'Log Jumat Bersih': return <LogSheet judul="Log Jumat Bersih" kolom={['Tanggal','Area Pembersihan','Petugas','Hasil','Catatan','Dokumentasi Foto/Link']}/>
    case 'Dokumentasi Kelas': return <LogSheet judul="Dokumentasi Pembelajaran Berbasis Cinta" kolom={['Hari/Tanggal','Kelas/Rombel','Mata Pelajaran','Guru','Praktik KBC Teramati','Dokumentasi Foto/Link']}/>
    case 'Jurnal Guru KBC': return <JurnalGuru/>
    case 'Hasil Observasi Pembelajaran': return <ObservasiPembelajaran/>
    case 'Notulen Rapat Refleksi': return <Notulen/>
    case 'Catatan Tindak Lanjut': return <TindakLanjut/>
    case 'Instrumen Supervisi Kepala Madrasah': return <SupervisiKamad/>
    case 'Instrumen Supervisi Pengawas': return <SupervisiPengawas/>
    case 'Laporan Pelaksanaan KBC': return <LaporanPelaksanaan nama={nama} tapel={settings?.tahunPelajaran}/>
    case 'Laporan Rekomendasi': return <LaporanRekomendasi nama={nama}/>
    default: return <FormatUmum item={item}/>
  }})()
  return <div className="font-serif text-sm leading-relaxed"><PrintHeaderMadrasah madrasah={madrasah} settings={settings} judul={item.judul.toUpperCase()} />{body}{ttd}</div>
}

/* ===== 1. DOKUMEN PERENCANAAN ===== */
function SkTim({ nama }) {
  return <>
    <p className="text-center font-bold mb-1">SURAT KEPUTUSAN KEPALA MADRASAH</p>
    <p className="text-center font-bold mb-3">TENTANG PEMBENTUKAN TIM PELAKSANA KBC</p>
    <p className="mb-2"><b>Menimbang:</b> perlu dibentuk Tim Pelaksana implementasi Kurikulum Berbasis Cinta di {nama}.</p>
    <p className="mb-2"><b>Menetapkan:</b></p>
    <p className="mb-2">KESATU: Membentuk Tim Pelaksana KBC dengan susunan:</p>
    <table className="table-clean mb-3"><thead><tr><th>No</th><th>Nama</th><th>Jabatan dalam Tim</th><th>Jabatan di Madrasah</th></tr></thead><tbody>
      {[1,2,3,4,5].map(n => <tr key={n}><td>{n}</td><td>____________________</td><td>{n===1?'Ketua':n===2?'Sekretaris':'Anggota'}</td><td>____________________</td></tr>)}
    </tbody></table>
    <p className="mb-2">KEDUA: Tim bertugas merencanakan, melaksanakan, memantau, mengevaluasi, serta melaporkan implementasi KBC.</p>
    <p>KETIGA: Keputusan ini berlaku sejak tanggal ditetapkan.</p>
  </>
}

function ProgramKerja({ nama, tapel, kab }) {
  const tp = tapel || '____________________'
  return <>
    <p className="text-center font-bold mb-3">PROGRAM KERJA TIM PELAKSANA KBC</p>
    <p className="mb-2">Madrasah: <b>{nama}</b></p>
    <p className="mb-2">Tahun Pelajaran: <b>{tp}</b></p>
    <p className="font-semibold mt-4 mb-1">A. Latar Belakang</p>
    <p className="mb-3 text-justify">Kurikulum Berbasis Cinta (KBC) merupakan program implementasi nilai-nilai cinta dalam pendidikan di madrasah, meliputi cinta kepada Allah dan Rasulullah, cinta kepada ilmu, cinta kepada diri sendiri dan sesama, cinta kepada lingkungan, serta cinta kepada tanah air. {nama} sebagai madrasah piloting berkomitmen mengimplementasikan KBC secara menyeluruh.</p>
    <p className="font-semibold mb-1">B. Tujuan</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1"><li>Menjadi acuan pelaksanaan kegiatan KBC yang terencana dan terukur;</li><li>Mendorong penguatan budaya madrasah berbasis cinta;</li><li>Memastikan monitoring, evaluasi, dan tindak lanjut berjalan.</li></ol>
    <p className="font-semibold mb-1">C. Program Kegiatan</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Kegiatan</th><th>Waktu</th><th>Indikator</th><th>Penanggung Jawab</th></tr></thead><tbody>
      <tr><td>1</td><td>Penyusunan dokumen rencana implementasi KBC</td><td>Awal semester</td><td>Dokumen tersusun</td><td>Kepala Madrasah, Tim KBC</td></tr>
      <tr><td>2</td><td>Bimtek penyusunan modul ajar berbasis cinta</td><td>Bulan ke-1</td><td>Modul ajar tersusun</td><td>Tim KBC, Guru</td></tr>
      <tr><td>3</td><td>Pembiasaan salam-senyum-sapa</td><td>Setiap hari</td><td>Terlaksana konsisten</td><td>Seluruh warga madrasah</td></tr>
      <tr><td>4</td><td>Kegiatan anti-bullying & kepedulian sosial</td><td>Bulanan</td><td>Kegiatan terlaksana</td><td>Tim KBC, Guru BK</td></tr>
      <tr><td>5</td><td>Pembiasaan ibadah harian</td><td>Setiap hari</td><td>Ibadah berjalan rutin</td><td>Guru Agama</td></tr>
      <tr><td>6</td><td>Jumat Bersih & cinta lingkungan</td><td>Setiap Jumat</td><td>Lingkungan bersih</td><td>Tim KBC</td></tr>
      <tr><td>7</td><td>Monitoring capaian KBC</td><td>Bulanan</td><td>Laporan tersusun</td><td>Tim KBC</td></tr>
      <tr><td>8</td><td>Refleksi & evaluasi akhir semester</td><td>Akhir semester</td><td>Evaluasi & TL</td><td>Seluruh Tim KBC</td></tr>
    </tbody></table>
    <p className="font-semibold mb-1">D. Susunan Tim KBC</p>
    <table className="table-clean mb-3"><thead><tr><th>No</th><th>Nama</th><th>Jabatan</th><th>Tugas Utama</th></tr></thead><tbody>
      <tr><td>1</td><td>____________________</td><td>Ketua</td><td>Koordinasi & pengawas</td></tr>
      <tr><td>2</td><td>____________________</td><td>Sekretaris</td><td>Dokumentasi & administrasi</td></tr>
      <tr><td>3</td><td>____________________</td><td>Anggota</td><td>Pelaksana kegiatan</td></tr>
      <tr><td>4</td><td>____________________</td><td>Anggota</td><td>Pelaksana kegiatan</td></tr>
    </tbody></table>
  </>
}

function JadwalKegiatan() {
  const hari = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  return <>
    <p className="text-center font-bold mb-3">JADWAL KEGIATAN IMPLEMENTASI KBC</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Hari</th><th>Waktu</th><th>Kegiatan</th><th>Penanggung Jawab</th><th>Keterangan</th></tr></thead><tbody>
      {hari.map((h, i) => <tr key={h}><td>{i+1}</td><td>{h}</td><td>06.45-07.00</td><td>Salam-senyum-sapa di gerbang</td><td>Petugas piket</td><td>Harian</td></tr>)}
      {hari.map((h, i) => <tr key={h+'2'}><td>{i+7}</td><td>{h}</td><td>07.00-07.15</td><td>Doa bersama & tadarus</td><td>Guru agama</td><td>Harian</td></tr>)}
      <tr><td>13</td><td>Jumat</td><td>07.00-08.00</td><td>Jumat Bersih</td><td>Tim KBC</td><td>Mingguan</td></tr>
      <tr><td>14</td><td>Sabtu</td><td>09.00-10.00</td><td>Coaching/refleksi guru</td><td>Kepala Madrasah</td><td>Mingguan</td></tr>
      <tr><td>15</td><td>Bulanan</td><td>-</td><td>Rapat evaluasi Tim KBC</td><td>Ketua Tim</td><td>Bulanan</td></tr>
    </tbody></table>
  </>
}

/* ===== 2. PERANGKAT AJAR ===== */
function ModulAjar() {
  return <>
    <p className="text-center font-bold mb-3">FORMAT MODUL AJAR / RPP BERBASIS CINTA</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-40 font-medium">Nama Madrasah</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Mata Pelajaran</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Kelas / Fase</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Alokasi Waktu</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Guru Pengampu</td><td>: ____________________</td></tr>
    </tbody></table>
    <p className="font-semibold mb-1">A. Kompetensi Awal</p>
    <div className="border border-slate-300 min-h-12 p-2 mb-3 text-slate-400">[Deskripsi kondisi awal peserta didik...]</div>
    <p className="font-semibold mb-1">B. Profil Pelajar Pancasila & Nilai KBC</p>
    <div className="border border-slate-300 min-h-12 p-2 mb-3 text-slate-400">[Nilai KBC yang dikembangkan: cinta Allah & Rasul, cinta ilmu, cinta diri & sesama, cinta lingkungan, cinta tanah air...]</div>
    <p className="font-semibold mb-1">C. Tujuan Pembelajaran</p>
    <div className="border border-slate-300 min-h-12 p-2 mb-3 text-slate-400">[Tujuan pembelajaran yang mengintegrasikan nilai KBC...]</div>
    <p className="font-semibold mb-1">D. Kegiatan Pembelajaran</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>Tahap</th><th>Kegiatan</th><th>Nilai KBC Terintegrasi</th></tr></thead><tbody>
      <tr><td>Pendahuluan</td><td>____________________</td><td>____________________</td></tr>
      <tr><td>Inti</td><td>____________________</td><td>____________________</td></tr>
      <tr><td>Penutup</td><td>____________________</td><td>____________________</td></tr>
    </tbody></table>
    <p className="font-semibold mb-1">E. Asesmen</p>
    <div className="border border-slate-300 min-h-12 p-2 mb-3 text-slate-400">[Format asesmen sikap & pengetahuan...]</div>
  </>
}

/* ===== 3. BUDAYA MADRASAH ===== */
function TataTertib({ nama }) {
  return <>
    <p className="text-center font-bold mb-3">TATA TERTIB RAMAH ANAK<br />MADRASAH BERBASIS CINTA</p>
    <p className="mb-3">Madrasah: <b>{nama}</b></p>
    <p className="font-semibold mb-1">A. Ketentuan Umum</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1">
      <li>Setiap warga madrasah wajib menerapkan budaya salam, senyum, sapa, sopan, dan santun.</li>
      <li>Tidak ada bentuk kekerasan verbal maupun fisik di lingkungan madrasah.</li>
      <li>Setiap peserta didik berhak mendapatkan perlakuan yang adil dan tanpa diskriminasi.</li>
    </ol>
    <p className="font-semibold mb-1">B. Hak Peserta Didik</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1">
      <li>Mendapatkan lingkungan belajar yang aman, nyaman, dan menyenangkan.</li>
      <li>Mengekspresikan pendapat tanpa rasa takut.</li>
      <li>Mendapatkan bimbingan dari guru dengan penuh kasih sayang.</li>
    </ol>
    <p className="font-semibold mb-1">C. Kewajiban Warga Madrasah</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1">
      <li>Membiasakan salam-senyum-sapa setiap hari.</li>
      <li>Menjaga kebersihan dan keasrian lingkungan madrasah.</li>
      <li>Aktif mencegah dan melaporkan tindakan bullying.</li>
      <li>Menghargai perbedaan suku, agama, ras, dan antar golongan.</li>
    </ol>
    <p className="font-semibold mb-1">D. Sanksi</p>
    <p className="mb-3">Pelanggaran ditangani melalui pendekatan tahsin (perbaikan) dengan kasih sayang, bukan hukuman yang merendahkan martabat.</p>
  </>
}

function AntiBullying({ nama }) {
  return <>
    <p className="text-center font-bold mb-3">PROGRAM PENCEGAHAN DAN PENANGANAN BULLYING</p>
    <p className="mb-3">Madrasah: <b>{nama}</b></p>
    <p className="font-semibold mb-1">A. Definisi</p>
    <p className="mb-3">Bullying adalah perbuatan menyakiti secara berulang baik fisik, verbal, sosial, maupun cyber yang dilakukan oleh peserta didik/guru/tenaga kependidikan.</p>
    <p className="font-semibold mb-1">B. Bentuk-Bentuk Bullying</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1">
      <li>Fisik: memukul, mendorong, merampas barang.</li>
      <li>Verbal: mengejek, mengancam, memanggil dengan sebutan negatif.</li>
      <li>Sosial: mengucilkan, menyebarkan gosip.</li>
      <li>Cyber: intimidasi melalui media sosial.</li>
    </ol>
    <p className="font-semibold mb-1">C. Strategi Pencegahan</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1">
      <li>Sosialisasi anti-bullying di awal tahun pelajaran.</li>
      <li>Pembiasaan budaya cinta dan empati harian.</li>
      <li>Pembentukan tim anti-bullying (guru BK + perwakilan siswa).</li>
      <li>Kotak curhat/aspirasi di lokasi strategis.</li>
    </ol>
    <p className="font-semibold mb-1">D. Prosedur Penanganan</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>Tahap</th><th>Tindakan</th><th>PIC</th></tr></thead><tbody>
      <tr><td>1. Pelaporan</td><td>Korban/saksi melaporkan ke guru BK/wali kelas</td><td>Guru BK</td></tr>
      <tr><td>2. Verifikasi</td><td>Tim anti-bullying memverifikasi laporan</td><td>Tim Anti-Bullying</td></tr>
      <tr><td>3. Mediasi</td><td>Pertemuan pelaku-korban dengan pendampingan</td><td>Guru BK, Kepala Madrasah</td></tr>
      <tr><td>4. Tindak Lanjut</td><td>Pembinaan pelaku, pendampingan korban</td><td>Guru BK, Wali Kelas</td></tr>
    </tbody></table>
  </>
}

/* ===== 4. KEGIATAN PEMBIASAAAN ===== */
function LogSheet({ judul, kolom }) {
  return <>
    <p className="text-center font-bold mb-3">{judul.toUpperCase()}</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th>{kolom.map(k => <th key={k}>{k}</th>)}</tr></thead><tbody>
      {[1,2,3,4,5,6,7,8,9,10].map(n => <tr key={n}><td>{n}</td>{kolom.map(k => <td key={k}></td>)}</tr>)}
    </tbody></table>
    <p className="mt-3">Catatan/refleksi kegiatan:</p>
    <div className="border border-slate-300 min-h-16 p-2 mb-3">________________________________________________________________________________</div>
  </>
}

/* ===== 5. PEMBELAJARAN ===== */
function JurnalGuru() {
  return <>
    <p className="text-center font-bold mb-3">JURNAL HARIAN GURU KBC</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Nama Guru</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Mata Pelajaran</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Kelas</td><td>: ____________________</td></tr>
    </tbody></table>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Tanggal</th><th>Materi</th><th>Praktik KBC Diterapkan</th><th>Respon Peserta Didik</th><th>Refleksi Guru</th></tr></thead><tbody>
      {[1,2,3,4,5].map(n => <tr key={n}><td>{n}</td><td></td><td></td><td></td><td></td><td></td></tr>)}
    </tbody></table>
  </>
}

function ObservasiPembelajaran() {
  return <>
    <p className="text-center font-bold mb-3">LEMBAR HASIL OBSERVASI PEMBELAJARAN BERBASIS CINTA</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Nama Guru</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Kelas/Rombel</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Mata Pelajaran</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Tanggal</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Observer</td><td>: ____________________</td></tr>
    </tbody></table>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Aspek yang Diobservasi</th><th>Skor (0-3)</th><th>Catatan</th></tr></thead><tbody>
      {['Suasana belajar aman, nyaman, menyenangkan','Guru menanamkan kasih sayang & empati','Pembelajaran menghargai perbedaan peserta didik','Guru memberi teladan komunikasi santun','Peserta didik aktif dan dihargai','Tidak ada kekerasan verbal/fisik'].map((a, i) => <tr key={i}><td>{i+1}</td><td>{a}</td><td></td><td></td></tr>)}
    </tbody></table>
    <p>Keterangan Skor: 0 = Belum Mulai, 1 = Sudah Mulai, 2 = Sudah Terlaksana, 3 = Terlaksana Sangat Baik</p>
    <p className="mt-3">Rekomendasi:</p>
    <div className="border border-slate-300 min-h-16 p-2">________________________________________________________________________________</div>
  </>
}

/* ===== 6. REFLEKSI ===== */
function Notulen() {
  return <>
    <p className="text-center font-bold mb-3">NOTULEN RAPAT REFLEKSI & EVALUASI TIM KBC</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Hari/Tanggal</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Waktu</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Tempat</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Ketua Rapat</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Notulis</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Jumlah Hadir</td><td>: _____ orang</td></tr>
    </tbody></table>
    <p className="font-semibold mb-1">A. Agenda</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1"><li>Refleksi pelaksanaan KBC periode sebelumnya;</li><li>Identifikasi kendala dan hambatan;</li><li>Penyusunan rencana tindak lanjut.</li></ol>
    <p className="font-semibold mb-1">B. Pembahasan</p>
    <div className="border border-slate-300 min-h-20 p-2 mb-3 text-slate-400">[Catatan pembahasan rapat...]</div>
    <p className="font-semibold mb-1">C. Hasil & Kesepakatan</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Hasil/Kesepakatan</th><th>PIC</th><th>Target</th></tr></thead><tbody>
      {[1,2,3].map(n => <tr key={n}><td>{n}</td><td></td><td></td><td></td></tr>)}
    </tbody></table>
  </>
}

function TindakLanjut() {
  return <>
    <p className="text-center font-bold mb-3">CATATAN TINDAK LANJUT IMPLEMENTASI KBC</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Tanggal</th><th>Temuan/Kendala</th><th>Tindak Lanjut</th><th>PIC</th><th>Target Selesai</th><th>Status</th></tr></thead><tbody>
      {[1,2,3,4,5].map(n => <tr key={n}><td>{n}</td><td></td><td></td><td></td><td></td><td></td><td>Belum/Proses/Selesai</td></tr>)}
    </tbody></table>
  </>
}

/* ===== 7. SUPERVISI ===== */
function SupervisiKamad() {
  return <>
    <p className="text-center font-bold mb-3">INSTRUMEN SUPERVISI KEPALA MADRASAH<br />TERHADAP IMPLEMENTASI KBC</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Nama Madrasah</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Tanggal</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Supervisor</td><td>: ____________________</td></tr>
    </tbody></table>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Aspek</th><th>Indikator</th><th>Skor (0-3)</th><th>Catatan</th></tr></thead><tbody>
      {['Perencanaan: dokumen rencana KBC tersusun','Perencanaan: Tim KBC dibentuk','Pembelajaran: suasana aman & nyaman','Pembelajaran: nilai cinta ditanamkan','Budaya: salam-senyum-sapa konsisten','Budaya: anti-bullying berjalan','Panca Cinta: ibadah harian','Panca Cinta: cinta lingkungan','Evaluasi: refleksi rutin','Evaluasi: eviden terdokumentasi'].map((a, i) => <tr key={i}><td>{i+1}</td><td>{a.split(':')[0]}</td><td>{a.split(':')[1]}</td><td></td><td></td></tr>)}
    </tbody></table>
    <p>Skor: 0 = Belum Mulai, 1 = Sudah Mulai, 2 = Sudah Terlaksana, 3 = Terlaksana Sangat Baik</p>
    <p className="mt-3 font-semibold">Rekomendasi Supervisor:</p>
    <div className="border border-slate-300 min-h-16 p-2">________________________________________________________________________________</div>
  </>
}

function SupervisiPengawas() {
  return <>
    <p className="text-center font-bold mb-3">INSTRUMEN SUPERVISI PENGAWAS MADRASAH<br />TERHADAP IMPLEMENTASI KBC</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Nama Pengawas</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Nama Madrasah</td><td>: ____________________</td></tr>
      <tr><td className="font-medium">Tanggal</td><td>: ____________________</td></tr>
    </tbody></table>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Aspek Penilaian</th><th>Indikator</th><th>Skor (0-3)</th><th>Bukti/Eviden</th></tr></thead><tbody>
      {['A. Perencanaan: Dokumen rencana implementasi KBC','A. Perencanaan: Tim KBC aktif berfungsi','B. Pembelajaran: Modul ajar memuat nilai KBC','B. Pembelajaran: Praktik pembelajaran berbasis cinta','C. Budaya: Pembiasaan salam-senyum-sapa','C. Budaya: Program anti-bullying berjalan','D. Panca Cinta: Pembiasaan ibadah & cinta tanah air','D. Panca Cinta: Kegiatan cinta lingkungan','E. Evaluasi: Monitoring & refleksi rutin','E. Evaluasi: Eviden terdokumentasi lengkap'].map((a, i) => { const [aspek, ind] = a.split(': '); return <tr key={i}><td>{i+1}</td><td>{aspek}</td><td>{ind}</td><td></td><td></td></tr> })}
    </tbody></table>
    <p>Skor: 0 = Belum Mulai, 1 = Sudah Mulai, 2 = Sudah Terlaksana, 3 = Terlaksana Sangat Baik</p>
    <p className="mt-3">Total Skor: ____ / 30</p>
    <p>Persentase: ____%</p>
    <p className="mt-3 font-semibold">Catatan & Rekomendasi:</p>
    <div className="border border-slate-300 min-h-20 p-2">________________________________________________________________________________</div>
  </>
}

/* ===== 8. LAPORAN ===== */
function LaporanPelaksanaan({ nama, tapel }) {
  return <>
    <p className="text-center font-bold mb-3">LAPORAN PELAKSANAAN IMPLEMENTASI KBC</p>
    <table className="table-clean mb-3"><tbody>
      <tr><td className="w-32 font-medium">Nama Madrasah</td><td>: {nama}</td></tr>
      <tr><td className="font-medium">Tahun Pelajaran</td><td>: {tapel || '____________________'}</td></tr>
      <tr><td className="font-medium">Periode</td><td>: ____________________</td></tr>
    </tbody></table>
    <p className="font-semibold mb-1">A. Kegiatan yang Telah Dilaksanakan</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Kegiatan</th><th>Waktu</th><th>Hasil</th><th>Kendala</th></tr></thead><tbody>
      {[1,2,3,4,5].map(n => <tr key={n}><td>{n}</td><td></td><td></td><td></td><td></td></tr>)}
    </tbody></table>
    <p className="font-semibold mb-1">B. Capaian per Aspek</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>Aspek</th><th>Skor Rata-rata</th><th>Kategori</th><th>Catatan</th></tr></thead><tbody>
      {['A. Perencanaan','B. Pembelajaran','C. Budaya Madrasah','D. Panca Cinta','E. Evaluasi'].map((a, i) => <tr key={i}><td>{a}</td><td></td><td></td><td></td></tr>)}
    </tbody></table>
    <p className="font-semibold mb-1">C. Refleksi & Tindak Lanjut</p>
    <div className="border border-slate-300 min-h-20 p-2 mb-3">________________________________________________________________________________</div>
  </>
}

function LaporanRekomendasi({ nama }) {
  return <>
    <p className="text-center font-bold mb-3">LAPORAN EVALUASI & REKOMENDASI KBC</p>
    <p className="mb-3">Madrasah: <b>{nama}</b></p>
    <p className="font-semibold mb-1">A. Ringkasan Capaian</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>Aspek</th><th>Skor</th><th>Kategori</th></tr></thead><tbody>
      {['A. Perencanaan','B. Pembelajaran','C. Budaya','D. Panca Cinta','E. Evaluasi'].map((a, i) => <tr key={i}><td>{a}</td><td></td><td></td></tr>)}
    </tbody></table>
    <p className="font-semibold mb-1">B. Kelebihan/Praktik Baik</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1"><li>____________________</li><li>____________________</li><li>____________________</li></ol>
    <p className="font-semibold mb-1">C. Kendala & Hambatan</p>
    <ol className="list-decimal ml-6 mb-3 space-y-1"><li>____________________</li><li>____________________</li></ol>
    <p className="font-semibold mb-1">D. Rekomendasi</p>
    <table className="table-clean mb-3 text-xs"><thead><tr><th>No</th><th>Rekomendasi</th><th>PIC</th><th>Target</th></tr></thead><tbody>
      {[1,2,3,4,5].map(n => <tr key={n}><td>{n}</td><td></td><td></td><td></td></tr>)}
    </tbody></table>
    <p className="font-semibold mb-1">E. Rencana Keberlanjutan</p>
    <div className="border border-slate-300 min-h-16 p-2">________________________________________________________________________________</div>
  </>
}

function FormatUmum({ item }) {
  return <p className="text-center text-slate-500 py-8">Template "{item.judul}" ΓÇö format dapat disesuaikan oleh madrasah.</p>
}

