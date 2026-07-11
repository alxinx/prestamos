'use strict'

const { htmlBase, botonCTA, notaExpiracion } = require('./helpers')

function emailActivacionColaborador({ nombreCompleto, nombreNegocio, rol, urlActivacion }) {
  const filas = `
    <tr>
      <td style="background:#ffffff;padding:40px 40px 32px;">
        <p style="font-size:13px;font-weight:600;color:#00C982;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Te dieron acceso a GotaPay
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          <strong style="color:#001430;">${nombreNegocio}</strong> te agregó como
          <strong style="color:#001430;">${rol}</strong> en su panel de GotaPay.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px;">
          Solo falta un paso: <strong style="color:#001430;">crear tu contraseña</strong> para poder ingresar.
        </p>

        ${botonCTA({ url: urlActivacion, texto: 'Crear mi contraseña →' })}

        ${notaExpiracion(72)}
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailActivacionColaborador }
