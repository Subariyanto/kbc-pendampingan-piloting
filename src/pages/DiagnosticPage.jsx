import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { runDiagnostic } from '../lib/repository.js'
import { SUPABASE_ENABLED } from '../lib/supabase.js'

// Halaman diagnostic — dipakai untuk debugging Supabase auth/RLS dari user perspective.
export default function DiagnosticPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    setRunning(true)
    try {
      const r = await runDiagnostic()
      setResult(r)
    } catch (err) {
      setResult({ ok: false, step: 'exception', message: err.message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Diagnostic Koneksi"
        description="Tes koneksi Supabase, autentikasi, dan policy RLS."
        icon="🩺"
      />
      <div className="card-pad mb-4">
        <p className="text-sm text-slate-700 mb-3">
          <strong>Mode:</strong> {SUPABASE_ENABLED ? 'Supabase (produksi)' : 'localStorage (lokal)'}
        </p>
        <button className="btn-primary" onClick={run} disabled={running}>
          {running ? 'Menjalankan…' : '▶ Jalankan Test'}
        </button>
      </div>

      {result && (
        <div className={`card-pad ${result.ok ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <p className="font-semibold mb-2">
            {result.ok ? '✅ Semua test pass' : `❌ Gagal di step: ${result.step}`}
          </p>
          {result.message && <p className="text-sm mb-2">{result.message}</p>}
          {result.details && <p className="text-xs text-slate-600 mb-1"><strong>Details:</strong> {result.details}</p>}
          {result.hint && <p className="text-xs text-slate-600 mb-1"><strong>Hint:</strong> {result.hint}</p>}
          {result.log?.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium">Detail log ({result.log.length} step)</summary>
              <pre className="mt-2 text-xs bg-white border border-slate-200 rounded p-3 overflow-x-auto">
                {JSON.stringify(result.log, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </>
  )
}
