import PageHeader from '../components/PageHeader.jsx'

export default function ProgramPendampinganPage() {
  return (
    <>
      <PageHeader
        title="Program Pendampingan Pengawas"
        icon="📝"
        description="Penyusunan dan pengelolaan program pendampingan madrasah piloting oleh pengawas."
      />
      <div className="card-pad">
        <h2 className="font-semibold text-navy-900 mb-2">Program Pendampingan Pengawas</h2>
        <p className="text-sm text-slate-600">
          Halaman program pendampingan siap dikembangkan sesuai kebutuhan dokumen dan kegiatan pengawas.
        </p>
      </div>
    </>
  )
}
