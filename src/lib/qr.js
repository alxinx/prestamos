'use strict'

const qrcode = require('qrcode-generator')

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

module.exports = { urlVerificacion, generarQrSvg }
