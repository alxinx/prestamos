'use strict'

const { htmlBase } = require('./helpers')

function emailSocioSuspendido({ nombreCompleto, nombreNegocio }) {
  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#991B1B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Perfil de socio suspendido
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> suspendió tu perfil de socio en GotaPay.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0;">
          A partir de ahora no se te asignarán nuevos capitales. Los capitales que ya tienes activos siguen
          funcionando con total normalidad — esta acción no los afecta.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#EF4444', filas })
}

module.exports = { emailSocioSuspendido }
