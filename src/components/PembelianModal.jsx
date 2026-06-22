import { getPembelianInfo } from '../lib/pembelian.js'

// Modal "Beli Lisensi FULL" — tampilkan info pembelian + tombol WA
export default function PembelianModal({ open, onClose }) {
  if (!open) return null
  const info = getPembelianInfo()
  const waNumber = String(info.wa || '').replace(/[^0-9]/g, '')
  const waMessage = encodeURIComponent(
    `Halo Pak Subariyanto, saya tertarik untuk membeli Lisensi FULL aplikasi Pendampingan KBC. Mohon info lebih lanjut. Terima kasih.`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-navy-900 to-toska-700 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white text-xl w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <h2 className="text-lg font-semibold">Beli Lisensi FULL</h2>
              <p className="text-xs text-white/80">Akses penuh tanpa batas waktu</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {info.bannerText && (
            <p className="text-sm text-slate-700 leading-relaxed">
              {info.bannerText}
            </p>
          )}

          {/* Harga */}
          <div className="bg-gradient-to-br from-amber-50 to-toska-50 rounded-xl p-4 border border-toska-200">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Harga Lisensi Pro</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-navy-900">Rp {info.proPrice}</span>
              <span className="text-xs text-slate-500">/ akun (lifetime)</span>
            </div>
            {Number(info.trialDays) > 0 && (
              <p className="text-xs text-amber-700 mt-2">
                🎁 Tersedia trial gratis {info.trialDays} hari sebelum berlangganan
              </p>
            )}
          </div>

          {/* Cara Pembayaran */}
          {info.bankInfo && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                Pembayaran Transfer
              </p>
              <p className="text-sm text-navy-900 bg-slate-50 rounded-lg p-3 border border-slate-200 font-mono whitespace-pre-line">
                {info.bankInfo}
              </p>
            </div>
          )}

          {/* Cara Beli */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">📋 Cara Pembelian:</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Klik tombol <strong>Hubungi Admin via WhatsApp</strong> di bawah</li>
              <li>Kirim bukti transfer ke admin</li>
              <li>Admin akan kirim kode aktivasi ke nomor Bapak/Ibu</li>
              <li>Klik <strong>Daftar Akun Baru</strong>, masukkan kode aktivasi</li>
              <li>Akun aktif dan langsung bisa dipakai</li>
            </ol>
          </div>

          {/* CTA WhatsApp */}
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              💬 Hubungi Admin via WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="block w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
