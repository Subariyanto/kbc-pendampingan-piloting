import { useState, useEffect } from 'react'
import { validateCode, saveLicense, getStoredLicense, fetchRemoteCodes, saveLocalCodes, tryLoadLocalCodes } from '../lib/codes.js'

export default function ActivationPage({ onActivated }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)

  // Cek lisensi tersimpan
  useEffect(() => {
    const existing = getStoredLicense()
    if (existing) {
      // Validasi ulang expiry
      if (existing.tier === 'demo' && existing.expiresAt && Date.now() > existing.expiresAt) {
        // Expired — tetap show activation screen
        setCheckingExisting(false)
        return
      }
      onActivated(existing)
      return
    }
    setCheckingExisting(false)
  }, [onActivated])

  // Try fetch remote codes silently
  useEffect(() => {
    fetchRemoteCodes().then((codes) => {
      if (Array.isArray(codes)) {
        saveLocalCodes(codes)
      }
    }).catch(() => {})
  }, [])

  const handleActivate = async (e) => {
    e.preventDefault()
    const clean = String(code).trim()
    if (!clean) {
      setError('Masukkan kode aktivasi')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Try remote codes dulu
      let bundledCodes = tryLoadLocalCodes()
      try {
        const remote = await fetchRemoteCodes()
        if (Array.isArray(remote)) {
          bundledCodes = remote
          saveLocalCodes(remote)
        }
      } catch {}

      const result = validateCode(clean, bundledCodes)
      if (!result.valid) {
        setError(result.error || 'Kode aktivasi tidak valid')
        setLoading(false)
        return
      }

      const license = saveLicense(clean, result.tier)
      onActivated(license)
    } catch (err) {
      setError('Gagal memvalidasi kode. Periksa koneksi internet.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800">
        <p className="text-white/60 text-sm">Memeriksa lisensi…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-toska-500/20 ring-4 ring-toska-400/10 mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-white">Aktivasi Aplikasi</h1>
          <p className="text-sm text-slate-300 mt-2">
            Pendampingan Piloting Kurikulum Berbasis Cinta
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan kode aktivasi untuk mulai menggunakan aplikasi
          </p>
        </div>

        <form onSubmit={handleActivate} className="bg-white rounded-xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="label text-navy-900">Kode Aktivasi</label>
            <input
              className="input text-center text-lg tracking-widest font-mono uppercase"
              placeholder="KBC-XXXX-XXXX"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={loading}
          >
            {loading ? 'Memvalidasi…' : 'Aktivasi'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Belum punya kode?{' '}
            <a
              href="https://wa.me/6282330647698?text=Saya%20butuh%20kode%20aktivasi%20KBC%20Pendampingan%20Piloting"
              target="_blank"
              rel="noreferrer"
              className="text-toska-700 hover:underline"
            >
              Hubungi Admin via WhatsApp
            </a>
          </p>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Pokjawas Madrasah Kemenag Kab. Jember
        </p>
      </div>
    </div>
  )
}