'use strict'

const { htmlBase, formatearPrecio, generarFilasMovimientos } = require('./helpers')

function emailCapitalReactivado({ nombreCompleto, nombreNegocio, nombreCapital, valorTotal, disponible, enUso, movimientos }) {
  const filasMovimientos = generarFilasMovimientos(movimientos)

  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Capital reactivado
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> reactivó el capital
          <strong style="color:#001430;">${nombreCapital}</strong> en GotaPay.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
          Este capital ya puede volver a asignarse a nuevos préstamos con total normalidad.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;margin-bottom:28px;">
          <tr>
            <td style="padding:22px 26px;">
              <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Valor total</p>
              <p style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 18px;letter-spacing:-0.02em;">${formatearPrecio(valorTotal)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:50%;vertical-align:top;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Disponible</p>
                  <p style="font-size:16px;font-weight:800;color:#56fbab;margin:0;">${formatearPrecio(disponible)}</p>
                </td>
                <td style="width:50%;vertical-align:top;">
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">En uso</p>
                  <p style="font-size:16px;font-weight:800;color:#ffffff;margin:0;">${formatearPrecio(enUso)}</p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>

        <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Últimos movimientos
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${filasMovimientos}
        </table>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailCapitalReactivado }
