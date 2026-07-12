'use strict'

const { htmlBase, formatearPrecio } = require('./helpers')

function emailCapitalAsignado({ nombreCompleto, nombreNegocio, nombreCapital, valorCapital }) {
  const valorFormateado = formatearPrecio(valorCapital)

  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Nuevo capital asignado
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> te asignó un nuevo capital en GotaPay.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 26px;">
              <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Capital</p>
              <p style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 16px;letter-spacing:-0.02em;">${nombreCapital}</p>
              <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Valor asignado</p>
              <p style="font-size:26px;font-weight:800;color:#56fbab;margin:0;">${valorFormateado}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailCapitalAsignado }
