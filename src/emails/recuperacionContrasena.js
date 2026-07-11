'use strict'

const { botonCTA, htmlBase } = require('./helpers')

function emailRecuperacionContrasena({ nombreCompleto, urlReset }) {
  const filas = `
    <!-- ══ ÍCONO + TÍTULO ══ -->
    <tr>
      <td style="background:#ffffff;padding:40px 40px 0;text-align:center;">
        <div style="width:64px;height:64px;background:#eef2f7;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:64px;">
          <span style="font-size:28px;line-height:64px;">🔑</span>
        </div>
        <p style="font-size:12px;font-weight:700;color:#006d43;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">
          Recuperación de contraseña
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          ¿Olvidaste tu contraseña?
        </h1>
      </td>
    </tr>

    <!-- ══ CUERPO ══ -->
    <tr>
      <td style="background:#ffffff;padding:20px 40px 36px;">
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 8px;">
          Hola, <strong style="color:#001430;">${nombreCompleto}</strong>.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en GotaPay.
          Si fuiste tú, haz clic en el botón de abajo. Si no reconoces esta solicitud, ignora este correo — tu cuenta sigue segura.
        </p>

        <div style="text-align:center;margin:0 0 20px;">
          ${botonCTA({ url: urlReset, texto: 'Recuperar contraseña →', colorTexto: '#56fbab' })}
        </div>

        <!-- Nota expiración -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#f8f9ff;border:1px solid #dce9ff;border-radius:10px;margin-top:8px;">
          <tr>
            <td style="padding:14px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:28px;vertical-align:top;padding-right:10px;font-size:16px;line-height:20px;">⏱️</td>
                <td>
                  <p style="font-size:13px;color:#475569;margin:0;line-height:1.5;">
                    Este enlace expira en <strong style="color:#001430;">1 hora</strong>. Si necesitas uno nuevo, vuelve a la pantalla de recuperación.
                  </p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>

        <!-- Enlace alternativo -->
        <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;line-height:1.5;word-break:break-all;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <span style="color:#aac7fd;">${urlReset}</span>
        </p>
      </td>
    </tr>

    <!-- ══ AVISO DE SEGURIDAD ══ -->
    <tr>
      <td style="background:#ffffff;padding:0 40px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:12px;">
          <tr>
            <td style="padding:18px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:32px;vertical-align:top;padding-right:12px;font-size:18px;line-height:20px;">🛡️</td>
                <td>
                  <p style="font-size:13px;font-weight:700;color:#56fbab;margin:0 0 4px;">
                    GotaPay nunca te pedirá tu contraseña
                  </p>
                  <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0;line-height:1.5;">
                    Nuestro equipo jamás te solicitará tu contraseña por correo, teléfono o chat. Si recibes ese tipo de mensajes, repórtalos.
                  </p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailRecuperacionContrasena }
