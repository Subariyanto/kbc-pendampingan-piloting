import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { resolvePengawasFromUser } from '../lib/pengawasResolver.js'

export default function LaporanLengkapPage() {
  const { state } = useData()
  const { user } = useAuth()
  const settings = state.settings
  const pengawas = resolvePengawasFromUser(user, state.pengawas)
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <button 
        onClick={handlePrint}
        className="no-print btn-primary mb-4"
      >
        🖨️ Cetak PDF
      </button>

      <div className="bg-white shadow-lg max-w-[210mm] mx-auto p-12">
        {/* COVER */}
        <div className="text-center page-break">
          {settings.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt="Logo" className="w-24 h-24 mx-auto mb-6 object-contain" />
          ) : (
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_Kementerian_Agama_Republik_Indonesia.svg" 
              alt="Logo Kemenag" 
              className="w-24 h-24 mx-auto mb-6 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold text-navy-900 mb-4">
            LAPORAN PENDAMPINGAN IMPLEMENTASI<br/>
            KURIKULUM BERBASIS CINTA
          </h1>
          <h2 className="text-xl text-slate-700 mb-8">
            MADRASAH PILOTING BINAAN POKJAWAS
          </h2>
          <div className="my-12 text-slate-600">
            <p className="text-lg font-semibold">{settings.namaInstansi}</p>
            <p>{settings.subInstansi}</p>
            <p className="mt-4">Tahun Pelajaran {settings.tahunPelajaran}</p>
          </div>
          <p className="text-xl font-bold text-navy-900 mt-12">
            {new Date().getFullYear()}
          </p>
        </div>

        {/* HALAMAN PENGESAHAN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-center text-navy-900 mb-8">HALAMAN PENGESAHAN</h2>
          <div className="text-sm leading-relaxed text-slate-700 space-y-4">
            <p className="text-justify">
              Laporan Pendampingan Implementasi Kurikulum Berbasis Cinta ini telah disusun dan disahkan 
              untuk menjadi dokumen resmi hasil pendampingan madrasah piloting binaan {settings.namaInstansi} 
              Tahun Pelajaran {settings.tahunPelajaran}.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-semibold">Ketua Pokjawas Madrasah</p>
                <p className="mt-16 border-t border-slate-300 pt-2 inline-block px-8">
                  {settings.ketuaPokjawas}
                </p>
                <p>NIP. {settings.nipKetua}</p>
              </div>
              <div className="text-center">
                <p>Pengawas Pendamping,</p>
                <p className="mt-16 border-t border-slate-300 pt-2 inline-block px-8">
                  {pengawas?.nama || '____________________'}
                </p>
                <p>NIP. {pengawas?.nip || '................................'}</p>
                {pengawas?.namaLengkap && <p className="mt-1">Nama Lengkap (gelar): {pengawas.namaLengkap}</p>}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            .no-print { display: none; }
            .page-break { page-break-after: always; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        {/* KATA PENGANTAR */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-center text-navy-900 mb-8">KATA PENGANTAR</h2>
          <div className="text-sm leading-relaxed text-slate-700 space-y-4 text-justify">
            <p>
              Alhamdulillah, puji syukur kehadirat Allah SWT yang telah memberikan rahmat dan hidayah-Nya 
              sehingga Laporan Pendampingan Implementasi Kurikulum Berbasis Cinta (KBC) di Madrasah Piloting 
              Binaan {settings.namaInstansi} Tahun Pelajaran {settings.tahunPelajaran} dapat diselesaikan.
            </p>
            <p>
              Kurikulum Berbasis Cinta merupakan pendekatan pendidikan yang mengutamakan nilai-nilai kasih sayang, 
              empati, toleransi, dan kepedulian dalam proses pembelajaran. Melalui program pendampingan ini, 
              kami berupaya mendukung madrasah piloting dalam mengimplementasikan KBC secara optimal, 
              sehingga dapat mewujudkan lingkungan belajar yang aman, nyaman, dan menyenangkan bagi peserta didik.
            </p>
            <p>
              Kami mengucapkan terima kasih kepada seluruh kepala madrasah, guru, dan stakeholder yang telah 
              berpartisipasi aktif dalam program pendampingan ini. Semoga laporan ini dapat memberikan gambaran 
              komprehensif mengenai pelaksanaan, capaian, serta rekomendasi tindak lanjut implementasi KBC 
              di madrasah piloting binaan kami.
            </p>
            <div className="mt-8 text-right">
              <p>{settings.subInstansi}</p>
              <p className="font-semibold mt-12">{pengawas?.nama || '____________________'}</p>
              <p>NIP. {pengawas?.nip || '................................'}</p>
            </div>
          </div>
        </div>

        {/* DAFTAR ISI */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-center text-navy-900 mb-8">DAFTAR ISI</h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>COVER</span><span>i</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>HALAMAN PENGESAHAN</span><span>ii</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>KATA PENGANTAR</span><span>iii</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>DAFTAR ISI</span><span>iv</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB I PENDAHULUAN</span><span>1</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB II LANDASAN KURIKULUM BERBASIS CINTA</span><span>3</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB III PROFIL MADRASAH PILOTING</span><span>5</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB IV INSTRUMEN PENILAIAN</span><span>7</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB V PELAKSANAAN PENDAMPINGAN</span><span>9</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB VI HASIL DAN CAPAIAN</span><span>11</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB VII KENDALA DAN SOLUSI</span><span>13</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB VIII REKOMENDASI</span><span>15</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>BAB IX PENUTUP</span><span>17</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1 font-semibold">
              <span>LAMPIRAN</span><span>19</span>
            </div>
          </div>
        </div>

        {/* BAB I PENDAHULUAN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB I<br/>PENDAHULUAN</h2>
          <div className="text-sm leading-relaxed text-slate-700 space-y-4">
            <h3 className="font-semibold text-navy-800 mt-4">1.1 Latar Belakang</h3>
            <p className="text-justify">
              Kurikulum Berbasis Cinta (KBC) merupakan inovasi pendidikan yang mengintegrasikan nilai-nilai 
              kasih sayang, empati, toleransi, dan kepedulian dalam seluruh aspek pembelajaran. Program ini 
              dirancang untuk menjawab tantangan pendidikan modern yang tidak hanya fokus pada aspek kognitif, 
              tetapi juga pengembangan karakter dan nilai-nilai kemanusiaan peserta didik.
            </p>
            <p className="text-justify">
              {settings.namaInstansi} menginisiasi program pendampingan implementasi KBC di madrasah-madrasah 
              piloting binaan untuk memastikan penerapan kurikulum ini berjalan efektif dan berkelanjutan. 
              Melalui pendampingan intensif, diharapkan madrasah dapat mengembangkan budaya madrasah yang 
              berbasis cinta dan menciptakan lingkungan belajar yang kondusif bagi tumbuh kembang peserta didik.
            </p>
            
            <h3 className="font-semibold text-navy-800 mt-6">1.2 Tujuan</h3>
            <p>Tujuan pendampingan implementasi KBC adalah:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Memfasilitasi madrasah piloting dalam mengimplementasikan Kurikulum Berbasis Cinta</li>
              <li>Melakukan monitoring dan evaluasi pelaksanaan KBC di madrasah binaan</li>
              <li>Memberikan pembinaan dan bimbingan teknis kepada kepala madrasah dan guru</li>
              <li>Mengidentifikasi best practices dan kendala implementasi KBC</li>
              <li>Menyusun rekomendasi tindak lanjut untuk perbaikan dan pengembangan</li>
            </ul>
            
            <h3 className="font-semibold text-navy-800 mt-6">1.3 Ruang Lingkup</h3>
            <p className="text-justify">
              Laporan ini mencakup kegiatan pendampingan implementasi KBC di {state.madrasah.length} madrasah 
              piloting binaan {settings.namaInstansi} pada Tahun Pelajaran {settings.tahunPelajaran}. 
              Pendampingan meliputi aspek perencanaan, pelaksanaan pembelajaran, budaya madrasah, Panca Cinta KBC, 
              serta evaluasi dan tindak lanjut.
            </p>
          </div>
        </div>

        {/* BAB II LANDASAN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB II<br/>LANDASAN KURIKULUM BERBASIS CINTA</h2>
          <div className="text-sm leading-relaxed text-slate-700 space-y-4">
            <h3 className="font-semibold text-navy-800 mt-4">2.1 Konsep Kurikulum Berbasis Cinta</h3>
            <p className="text-justify">
              Kurikulum Berbasis Cinta adalah pendekatan pembelajaran yang menempatkan cinta sebagai fondasi 
              utama dalam seluruh proses pendidikan. Cinta dalam konteks ini mencakup cinta kepada Allah dan Rasul-Nya, 
              cinta ilmu, cinta kepada diri sendiri dan sesama, cinta lingkungan, serta cinta tanah air. 
              Pendekatan ini menekankan pentingnya membangun hubungan yang harmonis, saling menghargai, dan penuh empati 
              antara semua komponen pendidikan.
            </p>
            <p className="text-justify">
              Implementasi KBC bertujuan menciptakan lingkungan belajar yang aman, nyaman, dan menyenangkan, 
              sehingga peserta didik dapat berkembang optimal baik secara akademik maupun non-akademik. 
              Guru berperan sebagai fasilitator yang penuh kasih sayang, membimbing dengan kelembutan, 
              dan menjadi teladan dalam berperilaku santun dan peduli.
            </p>
            
            <h3 className="font-semibold text-navy-800 mt-6">2.2 Panca Cinta KBC</h3>
            <p>Lima nilai utama dalam Kurikulum Berbasis Cinta (Panca Cinta):</p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Cinta kepada Allah dan Rasulullah:</strong> Menanamkan keimanan, ketakwaan, dan akhlak mulia</li>
              <li><strong>Cinta kepada ilmu:</strong> Menumbuhkan semangat belajar, rasa ingin tahu, dan literasi</li>
              <li><strong>Cinta kepada diri sendiri dan sesama:</strong> Membangun empati, toleransi, dan kepedulian sosial</li>
              <li><strong>Cinta kepada lingkungan:</strong> Menanamkan kesadaran ekologi dan tanggung jawab menjaga alam</li>
              <li><strong>Cinta kepada tanah air:</strong> Menumbuhkan nasionalisme, patriotisme, dan kebhinekaan</li>
            </ul>
            
            <h3 className="font-semibold text-navy-800 mt-6">2.3 Landasan Regulasi</h3>
            <p className="text-justify">
              Implementasi Kurikulum Berbasis Cinta mengacu pada berbagai regulasi dan kebijakan pendidikan nasional, 
              termasuk UU Sistem Pendidikan Nasional, Peraturan Menteri Agama tentang Kurikulum Madrasah, 
              serta kebijakan-kebijakan terkait penguatan pendidikan karakter dan profil pelajar Pancasila. 
              Program ini juga sejalan dengan visi misi Kementerian Agama dalam mewujudkan pendidikan Islam yang 
              moderat, berkualitas, dan berdaya saing.
            </p>
          </div>
        </div>

        {/* BAB III PROFIL MADRASAH */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB III<br/>PROFIL MADRASAH PILOTING</h2>
          <div className="text-sm">
            <p className="mb-4 text-slate-700">
              Berikut ini adalah profil madrasah piloting yang didampingi dalam implementasi Kurikulum Berbasis Cinta:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="border border-slate-300 p-2">No</th>
                    <th className="border border-slate-300 p-2">Nama Madrasah</th>
                    <th className="border border-slate-300 p-2">Jenjang</th>
                    <th className="border border-slate-300 p-2">Kepala Madrasah</th>
                    <th className="border border-slate-300 p-2">Kecamatan</th>
                    <th className="border border-slate-300 p-2">Status Piloting</th>
                  </tr>
                </thead>
                <tbody>
                  {state.madrasah.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                      <td className="border border-slate-300 p-2">{m.nama}</td>
                      <td className="border border-slate-300 p-2 text-center">{m.jenjang}</td>
                      <td className="border border-slate-300 p-2">{m.kepala}</td>
                      <td className="border border-slate-300 p-2">{m.kecamatan}</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          m.statusPiloting === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.statusPiloting}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BAB IV INSTRUMEN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB IV<br/>INSTRUMEN PENILAIAN</h2>
          <div className="text-sm">
            <p className="mb-4 text-slate-700">
              Instrumen penilaian implementasi KBC mencakup 5 aspek utama dengan berbagai indikator sebagai berikut:
            </p>
            <div className="space-y-6">
              {state.instrumen.map((aspek) => (
                <div key={aspek.id}>
                  <h3 className="font-semibold text-navy-800 mb-2">
                    Aspek {aspek.kode}: {aspek.nama}
                  </h3>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 w-16">No</th>
                        <th className="border border-slate-300 p-2">Indikator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aspek.indikator.map((ind) => (
                        <tr key={ind.id}>
                          <td className="border border-slate-300 p-2 text-center">{ind.nomor}</td>
                          <td className="border border-slate-300 p-2">{ind.teks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Kriteria Penilaian:</strong> 1 = Belum Mulai | 2 = Sudah Mulai | 3 = Sudah Terlaksana | 4 = Terlaksana Sangat Baik
              </p>
            </div>
          </div>
        </div>

        {/* BAB V PELAKSANAAN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB V<br/>PELAKSANAAN PENDAMPINGAN</h2>
          <div className="text-sm space-y-6">
            <div>
              <h3 className="font-semibold text-navy-800 mb-3">5.1 Jadwal Pendampingan</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="border border-slate-300 p-2">No</th>
                      <th className="border border-slate-300 p-2">Tanggal</th>
                      <th className="border border-slate-300 p-2">Madrasah</th>
                      <th className="border border-slate-300 p-2">Bentuk Kegiatan</th>
                      <th className="border border-slate-300 p-2">Materi</th>
                      <th className="border border-slate-300 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.jadwal.slice(0, 10).map((j, i) => {
                      const m = state.madrasah.find(x => x.id === j.madrasahId)
                      return (
                        <tr key={j.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                          <td className="border border-slate-300 p-2 text-center">{j.tanggal}</td>
                          <td className="border border-slate-300 p-2">{m?.nama || '-'}</td>
                          <td className="border border-slate-300 p-2">{j.bentuk}</td>
                          <td className="border border-slate-300 p-2">{j.materi}</td>
                          <td className="border border-slate-300 p-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              j.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {j.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-navy-800 mb-3">5.2 Hasil Pendampingan</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="border border-slate-300 p-2">No</th>
                      <th className="border border-slate-300 p-2">Tanggal</th>
                      <th className="border border-slate-300 p-2">Madrasah</th>
                      <th className="border border-slate-300 p-2">Kegiatan</th>
                      <th className="border border-slate-300 p-2">Pengawas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.pendampingan.slice(0, 10).map((p, i) => {
                      const m = state.madrasah.find(x => x.id === p.madrasahId)
                      const pw = state.pengawas.find(x => x.id === p.pengawasId)
                      return (
                        <tr key={p.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                          <td className="border border-slate-300 p-2 text-center">{p.tanggal}</td>
                          <td className="border border-slate-300 p-2">{m?.nama || '-'}</td>
                          <td className="border border-slate-300 p-2">{p.kegiatan}</td>
                          <td className="border border-slate-300 p-2">{pw?.nama || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* BAB VI HASIL */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB VI<br/>HASIL DAN CAPAIAN</h2>
          <div className="text-sm space-y-4">
            <p className="text-slate-700">
              Berikut adalah rekapitulasi capaian implementasi KBC per madrasah berdasarkan hasil pendampingan:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="border border-slate-300 p-2">No</th>
                    <th className="border border-slate-300 p-2">Nama Madrasah</th>
                    <th className="border border-slate-300 p-2">Rata-rata Skor</th>
                    <th className="border border-slate-300 p-2">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {state.madrasah.map((m, i) => {
                    const pendam = state.pendampingan.filter(p => p.madrasahId === m.id)
                    let totalSkor = 0
                    let count = 0
                    pendam.forEach(p => {
                      if (p.skor) {
                        Object.values(p.skor).forEach(s => {
                          totalSkor += s
                          count++
                        })
                      }
                    })
                    const rata = count > 0 ? (totalSkor / count * 25).toFixed(1) : 0
                    const kategori = rata >= 90 ? 'Sangat Baik' : rata >= 75 ? 'Baik' : rata >= 60 ? 'Cukup' : 'Perlu Pendampingan'
                    const bgColor = rata >= 90 ? 'bg-green-100 text-green-800' : rata >= 75 ? 'bg-blue-100 text-blue-800' : rata >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    
                    return (
                      <tr key={m.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                        <td className="border border-slate-300 p-2">{m.nama}</td>
                        <td className="border border-slate-300 p-2 text-center font-semibold">{rata}</td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${bgColor}`}>
                            {kategori}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-slate-100 rounded">
              <p className="text-xs text-slate-700">
                <strong>Kriteria Kategori:</strong> Sangat Baik ≥ 90 | Baik ≥ 75 | Cukup ≥ 60 | Perlu Pendampingan &lt; 60
              </p>
            </div>
          </div>
        </div>

        {/* BAB VII KENDALA */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB VII<br/>KENDALA DAN SOLUSI</h2>
          <div className="text-sm space-y-4 text-slate-700">
            <p className="text-justify">
              Berdasarkan hasil pendampingan di madrasah piloting, ditemukan beberapa kendala dalam implementasi 
              Kurikulum Berbasis Cinta, antara lain:
            </p>
            <div className="space-y-3">
              {state.pendampingan.slice(0, 5).map((p, i) => {
                const m = state.madrasah.find(x => x.id === p.madrasahId)
                return p.kendala ? (
                  <div key={p.id} className="border-l-4 border-amber-500 pl-3 py-2 bg-amber-50">
                    <p className="font-semibold text-amber-900">{m?.nama || 'Madrasah'}</p>
                    <p className="text-xs mt-1">{p.kendala}</p>
                  </div>
                ) : null
              }).filter(Boolean)}
            </div>
            <p className="text-justify mt-4">
              Solusi yang telah dan akan dilakukan untuk mengatasi kendala-kendala tersebut meliputi:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Intensifikasi bimbingan teknis dan coaching bagi guru dan kepala madrasah</li>
              <li>Penyediaan modul dan contoh best practice implementasi KBC</li>
              <li>Fasilitasi sharing session antar madrasah piloting</li>
              <li>Pendampingan berkelanjutan dengan jadwal yang terstruktur</li>
              <li>Monitoring dan evaluasi berkala untuk memantau progress</li>
            </ul>
          </div>
        </div>

        {/* BAB VIII REKOMENDASI */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB VIII<br/>REKOMENDASI</h2>
          <div className="text-sm space-y-4 text-slate-700">
            <p className="text-justify">
              Berdasarkan hasil pendampingan dan evaluasi implementasi KBC, berikut adalah rekomendasi 
              untuk pengembangan dan perbaikan:
            </p>
            
            <h3 className="font-semibold text-navy-800 mt-4">8.1 Rekomendasi untuk Madrasah</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Menyusun dan melaksanakan rencana implementasi KBC secara konsisten dan berkelanjutan</li>
              <li>Membentuk tim KBC yang solid dan berkomitmen tinggi</li>
              <li>Mengintegrasikan nilai-nilai Panca Cinta dalam seluruh kegiatan madrasah</li>
              <li>Melakukan dokumentasi dan refleksi berkala terhadap pelaksanaan KBC</li>
              <li>Melibatkan orang tua dan masyarakat dalam program-program berbasis cinta</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mt-4">8.2 Rekomendasi Tindak Lanjut</h3>
            <div className="overflow-x-auto mt-2">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="border border-slate-300 p-2">No</th>
                    <th className="border border-slate-300 p-2">Madrasah</th>
                    <th className="border border-slate-300 p-2">Rekomendasi</th>
                    <th className="border border-slate-300 p-2">Batas Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {state.tindakLanjut.slice(0, 8).map((tl, i) => {
                    const m = state.madrasah.find(x => x.id === tl.madrasahId)
                    return (
                      <tr key={tl.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                        <td className="border border-slate-300 p-2">{m?.nama || '-'}</td>
                        <td className="border border-slate-300 p-2">{tl.rekomendasi}</td>
                        <td className="border border-slate-300 p-2 text-center">{tl.batas}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BAB IX PENUTUP */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">BAB IX<br/>PENUTUP</h2>
          <div className="text-sm space-y-4 text-slate-700">
            <h3 className="font-semibold text-navy-800">9.1 Kesimpulan</h3>
            <p className="text-justify">
              Program pendampingan implementasi Kurikulum Berbasis Cinta di madrasah piloting binaan 
              {settings.namaInstansi} telah dilaksanakan dengan baik melalui berbagai bentuk kegiatan 
              meliputi sosialisasi, bimbingan teknis, observasi, coaching, dan monitoring evaluasi. 
              Dari {state.madrasah.length} madrasah piloting yang didampingi, sebagian besar menunjukkan 
              kemajuan positif dalam mengimplementasikan nilai-nilai Panca Cinta dalam pembelajaran dan 
              budaya madrasah.
            </p>
            <p className="text-justify">
              Meskipun masih terdapat berbagai kendala dan tantangan, komitmen kepala madrasah, guru, 
              dan seluruh warga madrasah untuk terus mengembangkan KBC patut diapresiasi. Dengan pendampingan 
              berkelanjutan dan konsistensi pelaksanaan, diharapkan implementasi KBC dapat semakin mengakar 
              dan memberikan dampak nyata bagi perkembangan karakter dan prestasi peserta didik.
            </p>
            
            <h3 className="font-semibold text-navy-800 mt-6">9.2 Saran</h3>
            <p>Beberapa saran untuk keberlanjutan program:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Perlu diperkuat komitmen dan dukungan dari semua pihak, termasuk komite madrasah dan wali murid</li>
              <li>Pengalokasian anggaran khusus untuk program-program berbasis cinta di madrasah</li>
              <li>Pengembangan jaringan madrasah KBC untuk sharing best practices dan saling belajar</li>
              <li>Evaluasi dan penyempurnaan instrumen penilaian KBC secara berkala</li>
              <li>Perluasan program piloting ke madrasah-madrasah lain secara bertahap</li>
            </ul>

            <div className="mt-8 text-right">
              <p>{settings.subInstansi}</p>
              <p>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-semibold mt-16">{pengawas?.nama || '____________________'}</p>
              <p>NIP. {pengawas?.nip || '................................'}</p>
            </div>
          </div>
        </div>

        {/* LAMPIRAN */}
        <div className="page-break">
          <h2 className="text-xl font-bold text-navy-900 mb-6">LAMPIRAN</h2>
          <div className="text-sm space-y-6">
            <div>
              <h3 className="font-semibold text-navy-800 mb-3">Lampiran 1: Daftar Eviden dan Dokumentasi</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="border border-slate-300 p-2">No</th>
                      <th className="border border-slate-300 p-2">Jenis</th>
                      <th className="border border-slate-300 p-2">Judul</th>
                      <th className="border border-slate-300 p-2">Madrasah</th>
                      <th className="border border-slate-300 p-2">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.eviden.map((ev, i) => {
                      const m = state.madrasah.find(x => x.id === ev.madrasahId)
                      return (
                        <tr key={ev.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                          <td className="border border-slate-300 p-2">{ev.jenis}</td>
                          <td className="border border-slate-300 p-2">{ev.judul}</td>
                          <td className="border border-slate-300 p-2">{m?.nama || '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{ev.tanggal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-navy-800 mb-3">Lampiran 2: Tim Pengawas Pendamping</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="border border-slate-300 p-2">No</th>
                      <th className="border border-slate-300 p-2">Nama</th>
                      <th className="border border-slate-300 p-2">NIP</th>
                      <th className="border border-slate-300 p-2">Pangkat/Gol</th>
                      <th className="border border-slate-300 p-2">Jabatan</th>
                      <th className="border border-slate-300 p-2">Wilayah Binaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.pengawas.map((pw, i) => (
                      <tr key={pw.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                        <td className="border border-slate-300 p-2">{pw.nama}</td>
                        <td className="border border-slate-300 p-2">{pw.nip}</td>
                        <td className="border border-slate-300 p-2">{pw.pangkat}</td>
                        <td className="border border-slate-300 p-2">{pw.jabatan}</td>
                        <td className="border border-slate-300 p-2">{pw.wilayah}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-100 rounded text-center">
              <p className="text-xs text-slate-600">--- AKHIR LAPORAN ---</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
