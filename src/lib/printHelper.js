// Print helper — buka window baru berisi cuma konten print-area, lalu print.
// Pendekatan ini hindari konflik CSS dari modal/sidebar/overlay di app.
import { getStoredLicense } from './codes.js'

export function printElement(element, { title = 'Cetak' } = {}) {
  if (!element) {
    window.print()
    return
  }
  const w = window.open('', '_blank', 'width=900,height=1200')
  if (!w) {
    // fallback kalau popup di-block
    window.print()
    return
  }

  // Cek lisensi: kalau lagi trial (tier=demo), tampilkan watermark TRIAL di setiap halaman
  const license = getStoredLicense()
  const isTrial = license?.tier === 'demo'
  const daysLeft = isTrial && license.expiresAt
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / 86400000))
    : 0
  const watermarkLabel = isTrial ? `TRIAL — ${daysLeft} HARI TERSISA` : ''

  // Salin semua stylesheet dari dokumen ke window baru
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n')

  // CSS print khusus — minimal, biar konten mengalir natural
  const printCSS = `
    <style>
      @page { margin: 10mm; }
      html, body { background: #fff; color: #000; margin: 0; padding: 12px; font-family: 'Inter', system-ui, sans-serif; font-size: 12pt; }
      .print-area { width: 100%; max-width: none; margin: 0; padding: 0; background: #fff; box-shadow: none; border: none; position: relative; }
      table { border-collapse: collapse; width: 100%; }
      table, th, td { border: 1px solid #d0d4dc; }
      th, td { padding: 6px 8px; vertical-align: top; }
      thead th { background: #f1f5f9; }
      h1,h2,h3,h4 { page-break-after: avoid; }
      table, tr, td, th { page-break-inside: avoid; }
      img { max-width: 100%; }
      button, .no-print { display: none !important; }
      ${isTrial ? `
      /* Watermark TRIAL diagonal di setiap halaman */
      body::before {
        content: '${watermarkLabel.replace(/'/g, "\\'")}'; 
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 100pt;
        font-weight: 900;
        color: rgba(220, 38, 38, 0.18);
        letter-spacing: 8px;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .trial-banner {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #78350f;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 10pt;
        font-weight: 600;
        margin-bottom: 8px;
        text-align: center;
      }
      ` : ''}
    </style>
  `

  const trialBanner = isTrial
    ? `<div class="trial-banner">⚠️ Dokumen ini dicetak dalam mode TRIAL (${daysLeft} hari tersisa). Untuk versi tanpa watermark, hubungi admin Pokjawas.</div>`
    : ''

  w.document.open()
  w.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${title}${isTrial ? ' — TRIAL' : ''}</title>
  ${styleLinks}
  ${printCSS}
</head>
<body>
  ${trialBanner}
  ${element.outerHTML}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
        window.addEventListener('afterprint', function() { window.close(); });
      }, 300);
    });
  </script>
</body>
</html>`)
  w.document.close()
}

// Helper: cari elemen .print-area pertama di document, lalu print
export function printPrintArea({ title = 'Cetak' } = {}) {
  const el = document.querySelector('.print-area')
  printElement(el, { title })
}
