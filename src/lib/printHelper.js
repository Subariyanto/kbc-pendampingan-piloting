// Print helper — preview on-screen dengan semua halaman A4, lalu cetak.
import { getStoredLicense } from './codes.js'

export function printElement(element, { title = 'Cetak' } = {}) {
  printPrintArea({ title })
}

export function printPrintArea({ title = 'Cetak' } = {}) {
  const el = document.querySelector('.print-area')
  if (!el) { window.print(); return }

  const license = getStoredLicense()
  const isTrial = license?.tier === 'demo'
  const daysLeft = isTrial && license.expiresAt
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / 86400000))
    : 0

  // A4 dimensions in px at 96dpi (210mm x 297mm)
  const A4_W = 794
  const A4_H = 1123
  const MARGIN = 40 // mm-ish padding

  // Clone print-area ke offscreen container untuk ukur tinggi asli
  const measure = el.cloneNode(true)
  measure.style.cssText = `width:${A4_W}px;position:absolute;left:-9999px;top:0;visibility:hidden`
  document.body.appendChild(measure)
  const contentHeight = measure.scrollHeight
  document.body.removeChild(measure)

  // Hitung jumlah halaman
  const pageContentH = A4_H - (MARGIN * 2)
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageContentH))

  // Scale supaya muat di layar (lebar viewport ~80%)
  const viewportW = window.innerWidth * 0.85
  const viewportH = window.innerHeight - 120
  const scaleX = Math.min(1, viewportW / A4_W)
  const pagesVisible = Math.max(1, Math.floor(viewportH / (A4_H * scaleX + 20)))
  const scale = scaleX

  // Build preview overlay
  const overlay = document.createElement('div')
  overlay.id = 'print-preview-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(30,41,59,0.6);backdrop-filter:blur(4px);display:flex;flex-direction:column'

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.style.cssText = 'flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#1e293b;color:#fff;font-family:system-ui'
  toolbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-weight:600;font-size:14px">📄 Pratinjau Cetak — ${title}${isTrial ? ' (TRIAL)' : ''}</span>
      <span style="font-size:12px;color:#94a3b8">${totalPages} halaman · A4 (210×297mm)</span>
    </div>
    <div style="display:flex;gap:8px">
      <button id="pp-btn-print" style="padding:6px 20px;background:#059669;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">🖨 Cetak</button>
      <button id="pp-btn-close" style="padding:6px 16px;background:#475569;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">✕ Tutup</button>
    </div>
  `
  overlay.appendChild(toolbar)

  // Pages container (scrollable)
  const pagesContainer = document.createElement('div')
  pagesContainer.style.cssText = `flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;align-items:center;gap:16px`

  // Clone content and split into pages
  for (let p = 0; p < totalPages; p++) {
    const page = document.createElement('div')
    page.className = 'print-preview-page'
    page.style.cssText = `
      width:${A4_W}px;height:${A4_H}px;
      background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.3);
      position:relative;overflow:hidden;flex-shrink:0;
      transform:scale(${scale});transform-origin:top center;
      margin-bottom:${(A4_H * scale - A4_H) + 16}px;
    `

    // Page number
    const pageNum = document.createElement('div')
    pageNum.style.cssText = 'position:absolute;bottom:12px;right:20px;font-size:10px;color:#94a3b8;font-family:system-ui'
    pageNum.textContent = `Halaman ${p + 1} dari ${totalPages}`
    page.appendChild(pageNum)

    // Content window — show portion of content for this page
    const content = document.createElement('div')
    content.style.cssText = `position:absolute;top:${MARGIN}px;left:${MARGIN}px;right:${MARGIN}px;height:${pageContentH}px;overflow:hidden`

    const inner = el.cloneNode(true)
    inner.style.cssText = `width:${A4_W - (MARGIN * 2)}px;position:absolute;top:${-(p * pageContentH)}px;left:0`
    content.appendChild(inner)
    page.appendChild(content)

    // Trial watermark
    if (isTrial) {
      const wm = document.createElement('div')
      wm.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72px;font-weight:900;color:rgba(220,38,38,0.12);letter-spacing:6px;pointer-events:none;white-space:nowrap;z-index:10`
      wm.textContent = `TRIAL — ${daysLeft} HARI`
      page.appendChild(wm)
    }

    pagesContainer.appendChild(page)
  }

  overlay.appendChild(pagesContainer)
  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  // Event handlers
  const close = () => {
    overlay.remove()
    document.body.style.overflow = ''
  }

  overlay.querySelector('#pp-btn-close').addEventListener('click', close)
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  overlay.querySelector('#pp-btn-print').addEventListener('click', () => {
    // Hide overlay, inject print CSS, print, then restore
    overlay.style.display = 'none'

    const printCSS = document.createElement('style')
    printCSS.id = 'print-helper-print-css'
    printCSS.textContent = `
      @media print {
        body > *:not(.print-area) { display:none !important; }
        .print-area {
          display:block !important;
          position:static !important;
          width:100% !important;
          max-width:none !important;
          margin:0 !important;
          padding:0 !important;
          box-shadow:none !important;
        }
        @page { margin:10mm; }
      }
    `
    document.head.appendChild(printCSS)

    const origTitle = document.title
    document.title = title + (isTrial ? ' — TRIAL' : '')

    const cleanup = () => {
      document.title = origTitle
      printCSS.remove()
      overlay.remove()
      document.body.style.overflow = ''
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    window.focus()
    setTimeout(() => window.print(), 100)
    setTimeout(cleanup, 5000)
  })
}
