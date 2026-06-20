import { useState, useEffect } from 'react'
import { generateCode, TIER_LABELS, MASTER_CODE, fetchRemoteCodes, saveLocalCodes, tryLoadLocalCodes } from '../lib/codes.js'

export default function LisensiPage() {
  const [codes, setCodes] = useState([])
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [count, setCount] = useState(5)
  const [tier, setTier] = useState('pro')
  const [note, setNote] = useState('')
  const [copyMsg, setCopyMsg] = useState('')

  // Load codes from local cache
  useEffect(() => {
    const local = tryLoadLocalCodes()
    setCodes(local)

    // Refresh from remote silently
    fetchRemoteCodes().then((remote) => {
      if (Array.isArray(remote)) {
        saveLocalCodes(remote)
        setCodes(remote)
      }
    }).catch(() => {})
  }, [])

  const handleGenerate = () => {
    setGenerating(true)
    const newCodes = []
    for (let i = 0; i < count; i++) {
      newCodes.push(generateCode(tier))
    }
    const merged = [...codes, ...newCodes]
    setCodes(merged)
    saveLocalCodes(merged)
    setGenerating(false)
  }

  const handleToggleUsed = (codeId) => {
    const updated = codes.map((c) =>
      c.id === codeId ? { ...c, used: !c.used, usedAt: !c.used ? new Date().toISOString() : null } : c
    )
    setCodes(updated)
    saveLocalCodes(updated)
  }

  const handleRemove = (codeId) => {
    const updated = codes.filter((c) => c.id !== codeId)
    setCodes(updated)
    saveLocalCodes(updated)
  }

  const handleRemoveAll = () => {
    if (!confirm('Yakin hapus semua kode?')) return
    setCodes([])
    saveLocalCodes([])
  }

  const handleExportJSON = () => {
    setExporting(true)
    const json = JSON.stringify(codes, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codes.json'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleCopyJSON = async () => {
    const json = JSON.stringify(codes, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      setCopyMsg('Berhasil disalin!')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      setCopyMsg('Gagal menyalin. Klik Export JSON.')
      setTimeout(() => setCopyMsg(''), 3000)
    }
  }

  const unused = codes.filter((c) => !c.used)
  const used = codes.filter((c) => c.used)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy-900">Kelola Lisensi</h1>
          <p className="text-sm text-slate-500">Generate kode aktivasi untuk pengguna aplikasi</p>
        </div>
      </div>

      {/* Master Code */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800">Master Code (Admin Internal)</p>
        <code className="mt-1 block text-lg font-mono tracking-widest text-amber-900 bg-amber-100 px-3 py-1.5 rounded">
          {MASTER_CODE}
        </code>
        <p className="text-xs text-amber-600 mt-1">Kode ini selalu valid. Jangan dibagikan ke pengguna umum.</p>
      </div>

      {/* Generate Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-navy-900">Generate Kode Baru</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Jumlah</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value || 5)))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="input">
              {Object.entries(TIER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full">
              {generating ? 'Generating…' : `Generate ${count} Kode`}
            </button>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleExportJSON} disabled={exporting} className="btn-outline text-sm">
          {exporting ? 'Exporting…' : '📥 Export JSON'}
        </button>
        <button onClick={handleCopyJSON} className="btn-outline text-sm">
          📋 Copy JSON
        </button>
        {copyMsg && <span className="text-xs text-toska-700 font-medium">{copyMsg}</span>}
        <div className="flex-1" />
        <button onClick={handleRemoveAll} className="btn-danger text-xs" disabled={codes.length === 0}>
          🗑 Hapus Semua
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-navy-900">{codes.length}</p>
          <p className="text-xs text-slate-500">Total Kode</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-toska-700">{unused.length}</p>
          <p className="text-xs text-slate-500">Belum Dipakai</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-400">{used.length}</p>
          <p className="text-xs text-slate-500">Sudah Dipakai</p>
        </div>
      </div>

      {/* Code List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Kode</th>
                <th className="px-4 py-3 font-medium text-slate-600">Tier</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Dibuat</th>
                <th className="px-4 py-3 font-medium text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada kode. Generate dulu.
                  </td>
                </tr>
              )}
              {codes.map((c) => (
                <tr key={c.id} className={c.used ? 'opacity-50' : ''}>
                  <td className="px-4 py-2.5 font-mono tracking-wide">{c.code}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge text-xs ${c.tier === 'pro' ? 'badge-toska' : c.tier === 'basic' ? 'badge-blue' : 'badge-amber'}`}>
                      {TIER_LABELS[c.tier] || c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.used ? (
                      <span className="text-rose-600 text-xs font-medium">Terpakai</span>
                    ) : (
                      <span className="text-toska-700 text-xs font-medium">Tersedia</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleUsed(c.id)}
                        className="text-xs px-2 py-1 rounded hover:bg-slate-100"
                        title={c.used ? 'Tandai belum dipakai' : 'Tandai sudah dipakai'}
                      >
                        {c.used ? '🔄' : '✅'}
                      </button>
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="text-xs px-2 py-1 rounded hover:bg-rose-50 text-rose-500"
                        title="Hapus"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-1">📤 Cara Deploy Kode</h3>
        <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
          <li>Generate kode di halaman ini</li>
          <li>Export JSON / Copy JSON</li>
          <li>Simpan file ke folder <code className="text-blue-900 bg-blue-100 px-1 rounded">data/codes.json</code> di repo</li>
          <li>Jalankan deploy script: <code className="text-blue-900 bg-blue-100 px-1 rounded">pwsh scripts/deploy-pages.ps1</code></li>
          <li>Kode akan tersedia online di halaman aktivasi pengguna baru</li>
        </ol>
      </div>
    </div>
  )
}