'use strict'

const { htmlBase } = require('./helpers')

function emailSocioMatriculado({ nombreCompleto, nombreNegocio }) {
  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">
        <p style="font-size:13px;font-weight:600;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Nuevo socio registrado
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> te registró como socio en su panel de GotaPay.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0;">
          A partir de ahora aparecerás como socio en los capitales que te asignen dentro de la plataforma, y te
          avisaremos por este medio cada vez que eso ocurra.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailSocioMatriculado }
