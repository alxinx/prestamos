'use strict'

const { htmlBase } = require('./helpers')

function emailSocioReactivado({ nombreCompleto, nombreNegocio }) {
  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Perfil de socio reactivado
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> reactivó tu perfil de socio en GotaPay.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0;">
          Ya puedes volver a ser asignado a nuevos capitales con total normalidad.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailSocioReactivado }
