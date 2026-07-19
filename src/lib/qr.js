'use strict'

const qrcode = require('qrcode-generator')
const QRCode = require('qrcode')

// URL pública que el QR de un voucher codifica — siempre apunta al endpoint de
// verificación, nunca a una ruta autenticada del panel.
function urlVerificacion(token) {
  return `${process.env.APP_URL}/verificar/${token}`
}

// SVG inline (no <img>/data-URI, no servicio externo de generación) — se embebe
// directo en la tirilla imprimible generada en el backend. El texto codificado
// nunca sale de nuestro control como pasaría con una API de QR de terceros.
function generarQrSvg(texto, { cellSize = 4, margin = 4 } = {}) {
  const qr = qrcode(0, 'M')
  qr.addData(texto)
  qr.make()
  return qr.createSvgTag({ cellSize, margin })
}

// PNG en Buffer — usado por el PDF de resumen de préstamo (src/lib/pdf/), cuyo
// motor de render (pdfkit, vía @react-pdf/renderer) no soporta SVG embebido,
// solo raster. Librería distinta a generarQrSvg (`qrcode`, no `qrcode-generator`)
// por eso, pero mismo principio: generación 100% local, nunca un servicio externo.
async function generarQrPngBuffer(texto, { margin = 1, width = 240 } = {}) {
  return QRCode.toBuffer(texto, { type: 'png', errorCorrectionLevel: 'M', margin, width })
}

module.exports = { urlVerificacion, generarQrSvg, generarQrPngBuffer }
