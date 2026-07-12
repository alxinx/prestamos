'use strict'

const { htmlBase, formatearPrecio } = require('./helpers')

function emailCapitalAjustado({ nombreCompleto, nombreNegocio, nombreCapital, tipo, valorAnterior, valorNuevo, monto, nombreContraparte }) {
  const esAgregar = tipo === 'AGREGAR'
  const colorAccento = esAgregar ? '#006d43' : '#EF4444'
  const etiquetaAccion = esAgregar ? 'Capital agregado' : 'Capital retirado'
  const etiquetaContraparte = esAgregar ? 'Recibido de' : 'Entregado a'

  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:${colorAccento};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          ${etiquetaAccion}
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> ${esAgregar ? 'agregó' : 'retiró'}
          <strong style="color:${colorAccento};">${formatearPrecio(monto)}</strong> ${esAgregar ? 'al' : 'del'} capital
          <strong style="color:#001430;">${nombreCapital}</strong>. ${etiquetaContraparte}: <strong style="color:#001430;">${nombreContraparte}</strong>.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:45%;vertical-align:top;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Valor anterior</p>
                  <p style="font-size:18px;font-weight:800;color:#ffffff;margin:0;">${formatearPrecio(valorAnterior)}</p>
                </td>
                <td style="width:10%;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;color:#aac7fd;">→</span>
                </td>
                <td style="width:45%;vertical-align:top;text-align:right;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Valor nuevo</p>
                  <p style="font-size:18px;font-weight:800;color:#56fbab;margin:0;">${formatearPrecio(valorNuevo)}</p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return htmlBase({ accentColor: colorAccento, filas })
}

module.exports = { emailCapitalAjustado }
