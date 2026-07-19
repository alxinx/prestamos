'use strict'

const { htmlBase, formatearPrecio } = require('./helpers')
const { ETIQUETAS_FRECUENCIA } = require('../lib/creditosConstantes')

// Correo enviado al cliente al otorgarle un préstamo (crearCredito en
// creditos.service.js), solo si tiene email registrado. El detalle completo
// (plan de pagos, garantía, cobrador, texto legal, QR de verificación) va en
// el PDF adjunto — este correo es solo el saludo + resumen rápido, mismo
// patrón que emailCapitalAsignado.js (tarjeta navy con los datos clave).
function emailResumenPrestamo({
  nombreCliente, nombreNegocio,
  montoInicial, tasaInteres, numeroCuotas, frecuenciaPago,
  valorCuota, valorPeriodico, esSoloIntereses,
}) {
  const montoFormateado = formatearPrecio(montoInicial)
  const frecuenciaEtiqueta = ETIQUETAS_FRECUENCIA[frecuenciaPago] || frecuenciaPago

  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Nuevo préstamo otorgado
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCliente} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> te otorgó un préstamo en GotaPay. Aquí tienes un resumen —
          el detalle completo con el plan de pagos está en el PDF adjunto a este correo.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 26px;">
              <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Valor prestado</p>
              <p style="font-size:26px;font-weight:800;color:#56fbab;margin:0 0 16px;">${montoFormateado}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:50%;vertical-align:top;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Tasa de interés</p>
                  <p style="font-size:16px;font-weight:800;color:#ffffff;margin:0;">${Number(tasaInteres)}% ${frecuenciaEtiqueta}</p>
                </td>
                <td style="width:50%;vertical-align:top;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">
                    ${esSoloIntereses ? `Interés ${frecuenciaEtiqueta.toLowerCase()}` : 'Valor de la cuota'}
                  </p>
                  <p style="font-size:16px;font-weight:800;color:#ffffff;margin:0;">
                    ${formatearPrecio(esSoloIntereses ? valorPeriodico : valorCuota)}
                  </p>
                </td>
              </tr></table>
              ${esSoloIntereses ? '' : `
              <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:16px 0 4px;">Número de cuotas</p>
              <p style="font-size:16px;font-weight:800;color:#ffffff;margin:0;">${numeroCuotas}</p>`}
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:20px 0 0;">
          Revisa el PDF adjunto para ver el plan de pagos completo, los datos de tu cobrador asignado y la información legal del documento.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#006d43', filas })
}

module.exports = { emailResumenPrestamo }
