'use strict'

function emailRecuperacionContrasena({ nombreCompleto, urlReset }) {
  const anio = new Date().getFullYear()
  const appUrl = process.env.APP_URL ?? ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Recupera tu contraseña — GotaPay</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#eef2f7;padding:40px 16px;">
  <tr><td align="center">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
      style="max-width:600px;width:100%;">

      <!-- ══ ENCABEZADO ══ -->
      <tr>
        <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:20px 40px;border-bottom:3px solid #001430;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;">
              <img src="${appUrl}/logotipo_sin%20slogan.webp" alt="GotaPay" width="140"
                style="display:block;height:auto;border:0;max-width:140px;" />
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:11px;font-weight:700;color:#001430;letter-spacing:0.08em;text-transform:uppercase;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                Seguridad de cuenta
              </span>
            </td>
          </tr></table>
        </td>
      </tr>

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

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
            <tr>
              <td style="border-radius:10px;background:#001430;">
                <a href="${urlReset}"
                  style="display:inline-block;padding:16px 40px;color:#56fbab;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                  Recuperar contraseña →
                </a>
              </td>
            </tr>
          </table>

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
      </tr>

      <!-- ══ PIE ══ -->
      <tr>
        <td style="background:#f8f9ff;border-radius:0 0 16px 16px;border-top:1px solid #e5eeff;padding:24px 40px;">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;text-align:center;line-height:1.6;">
            Si no solicitaste este cambio, ignora este correo — tu contraseña no será modificada.
          </p>
          <p style="font-size:12px;color:#cbd5e1;margin:0;text-align:center;">
            <strong style="color:#001430;">GotaPay</strong> · Crédito informal, gestionado con tecnología ·
            <span style="color:#aac7fd;">${anio}</span>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

module.exports = { emailRecuperacionContrasena }
