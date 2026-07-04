import { Link } from 'react-router-dom'
import { getStoredLicense } from '../lib/codes.js'

export default function TrialBanner() {
  const license = getStoredLicense()
  if (!license || license.tier !== 'demo') return null

  const daysLeft = license.expiresAt
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / 86400000))
    : 0

  // Warna badge tergantung sisa hari
  const tone = daysLeft <= 1
    ? { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', accent: 'bg-rose-600' }
    : daysLeft <= 2
      ? { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', accent: 'bg-amber-600' }
      : { bg: 'bg-toska-50', border: 'border-toska-300', text: 'text-navy-900', accent: 'bg-toska-600' }

  return (
    <div className={`${tone.bg} ${tone.border} border-2 rounded-xl px-4 py-3 mb-4 shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`${tone.accent} text-white text-xs font-bold uppercase tracking-wide px-2 py-1 rounded`}>
            🎁 TRIAL
          </div>
          <div className={`${tone.text} text-sm leading-relaxed`}>
            <p className="font-semibold">
              {daysLeft > 0
                ? `Mode Trial — sisa ${daysLeft} hari`
                : 'Mode Trial habis hari ini'}
            </p>
            <p className="text-xs opacity-80">
              Semua dokumen cetak akan diberi watermark TRIAL. Untuk akses penuh tanpa watermark, beli kode aktivasi.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/6282330647698?text=Saya%20ingin%20beli%20kode%20aktivasi%20KBC%20Pendampingan%20Piloting"
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-xs whitespace-nowrap"
        >
          💳 Beli Lisensi FULL
        </a>
      </div>
    </div>
  )
}
