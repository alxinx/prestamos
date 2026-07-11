'use strict'

const { formatearPrecio, generarFilasCaracteristicas, botonCTA, notaExpiracion, htmlBase } = require('./helpers')

function emailActivacionTenant({ nombreCompleto, nombreNegocio, plan, urlActivacion, urlTutorial }) {
  const precioFormateado = formatearPrecio(plan.precio)
  const filasCaracteristicas = generarFilasCaracteristicas(plan)

  const filas = `
    <!-- ══ CUERPO PRINCIPAL ══════════════════════════════════════ -->
    <tr>
      <td style="background:#ffffff;padding:40px 40px 32px;">

        <!-- Saludo -->
        <p style="font-size:13px;font-weight:600;color:#00C982;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          ¡Bienvenido a la familia!
        </p>
        <h1 style="font-size:24px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Hola, ${nombreCompleto} 👋
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          Nos emociona tenerle aquí. <strong style="color:#001430;">${nombreNegocio}</strong> ya tiene
          acceso activo a GotaPay — la plataforma diseñada para que usted gestione su cartera
          de crédito con la velocidad y confiabilidad que su negocio merece.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px;">
          Solo falta un paso: <strong style="color:#001430;">crear su contraseña.</strong>
          Lo hacemos así para que en ningún momento nosotros tengamos acceso a ella —
          su seguridad es nuestra prioridad.
        </p>

        ${botonCTA({ url: urlActivacion, texto: 'Crear mi contraseña →' })}

        ${notaExpiracion(72)}

      </td>
    </tr>

    <!-- ══ SEPARADOR ══════════════════════════════════════════════ -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <div style="height:1px;background:linear-gradient(to right,transparent,#e5eeff,transparent);"></div>
      </td>
    </tr>

    <!-- ══ TARJETA DE PLAN ════════════════════════════════════════ -->
    <tr>
      <td style="background:#ffffff;padding:32px 40px;">

        <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px;">
          Su plan contratado
        </p>

        <!-- Card oscura del plan -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;">
          <tr>
            <!-- Header de la card -->
            <td style="padding:22px 26px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Plan</p>
                    <p style="font-size:22px;font-weight:800;color:#ffffff;margin:0;letter-spacing:-0.02em;">${plan.nombre}</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="font-size:26px;font-weight:800;color:#00C982;margin:0;line-height:1;">${precioFormateado}</p>
                    <p style="font-size:11px;color:#475569;margin:4px 0 0;text-align:right;">/mes</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Características -->
          <tr>
            <td style="padding:18px 26px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${filasCaracteristicas}
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ══ SEPARADOR ══════════════════════════════════════════════ -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <div style="height:1px;background:linear-gradient(to right,transparent,#e5eeff,transparent);"></div>
      </td>
    </tr>

    <!-- ══ BLOQUE TUTORIAL ════════════════════════════════════════ -->
    <tr>
      <td style="background:#ffffff;padding:28px 40px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#f8f9ff;border:1px solid #dce9ff;border-radius:12px;">
          <tr>
            <td style="padding:24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:44px;vertical-align:top;padding-right:16px;">
                    <!-- Ícono play -->
                    <div style="width:40px;height:40px;background:#002855;border-radius:10px;text-align:center;line-height:40px;">
                      <span style="font-size:16px;color:#aac7fd;">▶</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="font-size:14px;font-weight:700;color:#001430;margin:0 0 3px;">
                      ¿Primera vez en GotaPay?
                    </p>
                    <p style="font-size:13px;color:#64748b;margin:0 0 14px;line-height:1.5;">
                      Siga nuestro tutorial paso a paso y empiece a gestionar su cartera en minutos.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background:#56fbab;border-radius:8px;">
                          <a href="${urlTutorial}"
                            style="display:inline-block;padding:10px 22px;color:#007146;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                            Ver tutorial en YouTube
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailActivacionTenant }
