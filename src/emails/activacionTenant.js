'use strict'

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatearLimite(valor, sufijo) {
  if (valor === -1) return `Ilimitados ${sufijo}`
  return `${new Intl.NumberFormat('es-CO').format(valor)} ${sufijo}`
}

function generarFilasCaracteristicas(plan) {
  const items = [
    { etiqueta: formatearLimite(plan.limitePrestamos, 'préstamos activos'),       incluido: true },
    { etiqueta: formatearLimite(plan.limiteCobradores, 'cobradores'),              incluido: true },
    { etiqueta: formatearLimite(plan.limiteMensajesWsp, 'mensajes WhatsApp/mes'), incluido: true },
    {
      etiqueta: plan.consultasScore > 0
        ? `${new Intl.NumberFormat('es-CO').format(plan.consultasScore)} consultas de score/mes`
        : 'Sin consultas de score',
      incluido: plan.consultasScore > 0,
    },
    { etiqueta: 'Bot de cobros automático',  incluido: plan.tieneBot },
    { etiqueta: 'Portal de clientes',        incluido: plan.tienePortalCliente },
    { etiqueta: 'Firma digital',             incluido: plan.tieneFirmaDigital },
  ]

  return items.map(({ etiqueta, incluido }) => `
    <tr>
      <td style="padding:7px 0;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:24px;vertical-align:middle;padding-right:10px;">
              ${incluido
                ? `<div style="width:20px;height:20px;background:#00C982;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                     <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M1 4L3.5 6.5L9 1" stroke="#001430" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                   </div>`
                : `<div style="width:20px;height:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:50%;display:inline-block;"></div>`
              }
            </td>
            <td style="font-size:13px;color:${incluido ? '#e2e8f0' : '#475569'};vertical-align:middle;">${etiqueta}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')
}

function emailActivacionTenant({ nombreCompleto, nombreNegocio, plan, urlActivacion, urlTutorial }) {
  const precioFormateado = formatearPrecio(plan.precio)
  const filasCaracteristicas = generarFilasCaracteristicas(plan)
  const anio = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Active su cuenta en GotaPay</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#eef2f7;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Contenedor principal (max 600px) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;">

          <!-- ══ ENCABEZADO DE MARCA ══════════════════════════════════ -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:20px 40px;border-bottom:3px solid #001430;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${process.env.APP_URL}/logotipo_sin%20slogan.webp"
                      alt="GotaPay"
                      width="140"
                      style="display:block;height:auto;border:0;max-width:140px;"
                    />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;font-weight:700;color:#001430;letter-spacing:0.08em;text-transform:uppercase;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                      Crédito inteligente
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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

              <!-- ── Botón CTA principal ── -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:10px;background:#001430;">
                    <a href="${urlActivacion}"
                      style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                      Crear mi contraseña →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Nota de expiración -->
              <p style="font-size:12px;color:#94a3b8;margin:14px 0 0;line-height:1.5;">
                🔒 Este enlace es personal e intransferible. Expira en <strong>72 horas</strong>.
              </p>

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
          </tr>

          <!-- ══ PIE DE PÁGINA ══════════════════════════════════════════ -->
          <tr>
            <td style="background:#f8f9ff;border-radius:0 0 16px 16px;border-top:1px solid #e5eeff;padding:24px 40px;">
              <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;text-align:center;line-height:1.6;">
                Si usted no esperaba este correo o cree que fue un error, puede ignorarlo — no pasará nada.
              </p>
              <p style="font-size:12px;color:#cbd5e1;margin:0;text-align:center;">
                <strong style="color:#001430;">GotaPay</strong> · Crédito informal, gestionado con tecnología ·
                <span style="color:#aac7fd;">${anio}</span>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Contenedor principal -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

module.exports = { emailActivacionTenant }
