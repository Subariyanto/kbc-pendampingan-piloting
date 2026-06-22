import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext.jsx'
import { fetchPembelianInfo, savePembelianRemote } from '../lib/pembelian.js'
import { SUPABASE_ENABLED } from '../lib/supabase.js'

const DEFAULT = {
  wa: '6282330647698',
  proPrice: '50.000',
  basicPrice: '0',
  trialDays: 5,
  bankInfo: 'BCA 1234567890 a.n. Subariyanto',
  bannerText: 'Hubungi Admin untuk pembelian lisensi'
}

export default function PembelianPage() {
  const toast = useToast()
  const [pembelian, setPembelian] = useState(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchPembelianInfo().then((info) => {
      if (active) {
        setPembelian(info)
        setLoading(false)
      }
    }).catch(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (SUPABASE_ENABLED) {
        const result = await savePembelianRemote(pembelian)
        if (!result.ok) {
          toast.error('Gagal simpan ke server: ' + result.error)
        } else {
          toast.success('Pengaturan pembelian disimpan & tersinkron ke semua user')
        }
      } else {
        // Mode lokal
        const { savePembelianInfo } = await import('../lib/pembelian.js')
        savePembelianInfo(pembelian)
        toast.success('Pengaturan pembelian disimpan (mode lokal)')
      }
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setPembelian(prev => ({ ...prev, [field]: value }))
  }

  const openWa = () => {
    const wa = pembelian.wa.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${wa}`, '_blank')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-navy-900">💳 Pengaturan Pembelian Lisensi</h1>
      <p className="text-sm text-slate-500">Atur informasi pembelian yang akan ditampilkan ke pengguna saat aktivasi.</p>

      <div className="space-y-4 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div>
          <label className="label">Nomor WhatsApp Penjualan</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={pembelian.wa}
              onChange={e => handleChange('wa', e.target.value)}
              placeholder="6282330647698"
            />
            <button type="button" onClick={openWa} className="btn-primary text-sm">Test WA</button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Pengguna akan menghubungi nomor ini untuk membeli lisensi</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Harga Lisensi Pro</label>
            <input
              className="input"
              value={pembelian.proPrice}
              onChange={e => handleChange('proPrice', e.target.value)}
              placeholder="50.000"
            />
          </div>
          <div>
            <label className="label">Harga Lisensi Basic</label>
            <input
              className="input"
              value={pembelian.basicPrice}
              onChange={e => handleChange('basicPrice', e.target.value)}
              placeholder="0 (gratis)"
            />
          </div>
        </div>

        <div>
          <label className="label">Masa Trial (hari)</label>
          <input
            className="input w-32"
            type="number"
            min="1"
            max="30"
            value={pembelian.trialDays}
            onChange={e => handleChange('trialDays', parseInt(e.target.value) || 5)}
          />
        </div>

        <div>
          <label className="label">Info Rekening Bank</label>
          <textarea
            className="input h-20"
            value={pembelian.bankInfo}
            onChange={e => handleChange('bankInfo', e.target.value)}
            placeholder="BCA 1234567890 a.n. ..."
          />
        </div>

        <div>
          <label className="label">Teks Banner Pembelian</label>
          <input
            className="input"
            value={pembelian.bannerText}
            onChange={e => handleChange('bannerText', e.target.value)}
            placeholder="Hubungi Admin untuk pembelian lisensi"
          />
        </div>

        <button type="button" onClick={handleSave} className="btn-primary" disabled={saving || loading}>
          {saving ? 'Menyimpan…' : '💾 Simpan Pengaturan'}
        </button>
        {loading && (
          <p className="text-xs text-slate-400 mt-2">Memuat data dari server…</p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">👁️ Preview Tampilan Pengguna</h3>
        <div className="bg-white rounded-lg p-3 border border-amber-100 space-y-2">
          <p className="text-xs text-slate-600">{pembelian.bannerText}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Pro: Rp{pembelian.proPrice}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Trial: {pembelian.trialDays} hari gratis</span>
          </div>
          <p className="text-xs text-slate-500">Pembayaran: {pembelian.bankInfo}</p>
          <a href={`https://wa.me/${pembelian.wa.replace(/[^0-9]/g, '')}`} className="inline-block text-xs px-3 py-1 bg-green-500 text-white rounded-full">
            💬 Beli via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}