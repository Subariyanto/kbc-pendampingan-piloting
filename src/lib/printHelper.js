// Print helper — buka window baru berisi cuma konten print-area, lalu print.
// Pendekatan ini hindari konflik CSS dari modal/sidebar/overlay di app.

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

  // Salin semua stylesheet dari dokumen ke window baru
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n')

  // CSS print khusus — minimal, biar konten mengalir natural
  const printCSS = `
    <style>
      @page { margin: 10mm; }
      html, body { background: #fff; color: #000; margin: 0; padding: 12px; font-family: 'Inter', system-ui, sans-serif; font-size: 12pt; }
      .print-area { width: 100%; max-width: none; margin: 0; padding: 0; background: #fff; box-shadow: none; border: none; }
      table { border-collapse: collapse; width: 100%; }
      table, th, td { border: 1px solid #d0d4dc; }
      th, td { padding: 6px 8px; vertical-align: top; }
      thead th { background: #f1f5f9; }
      h1,h2,h3,h4 { page-break-after: avoid; }
      table, tr, td, th { page-break-inside: avoid; }
      img { max-width: 100%; }
      button, .no-print { display: none !important; }
    </style>
  `

  w.document.open()
  w.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${styleLinks}
  ${printCSS}
</head>
<body>
  ${element.outerHTML}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
        // Tutup setelah print dialog ditutup (semua browser modern fire afterprint)
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
