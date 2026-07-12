'use strict'

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(valor)
}

function formatearLimite(valor, sufijo) {
  if (valor === -1) return `Ilimitados ${sufijo}`
  return `${new Intl.NumberFormat('es-CO').format(valor)} ${sufijo}`
}

function generarFilasCaracteristicas(plan) {
  const items = [
    { etiqueta: formatearLimite(plan.limitePrestamos,   'préstamos activos'),      incluido: true },
    { etiqueta: formatearLimite(plan.limiteColaboradores,  'cobradores'),              incluido: true },
    { etiqueta: formatearLimite(plan.limiteMensajesWsp, 'mensajes WhatsApp/mes'),  incluido: true },
    {
      etiqueta: plan.consultasScore > 0
        ? `${new Intl.NumberFormat('es-CO').format(plan.consultasScore)} consultas de score/mes`
        : 'Sin consultas de score',
      incluido: plan.consultasScore > 0,
    },
    { etiqueta: 'Bot de cobros automático', incluido: plan.tieneBot },
    { etiqueta: 'Portal de clientes',       incluido: plan.tienePortalCliente },
    { etiqueta: 'Firma digital',            incluido: plan.tieneFirmaDigital },
  ]

  return items.map(({ etiqueta, incluido }) => `
    <tr>
      <td style="padding:7px 0;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:24px;vertical-align:middle;padding-right:10px;">
            ${incluido
              ? `<div style="width:20px;height:20px;background:#00C982;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                   <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#001430" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                 </div>`
              : `<div style="width:20px;height:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:50%;display:inline-block;"></div>`
            }
          </td>
          <td style="font-size:13px;color:${incluido ? '#e2e8f0' : '#475569'};vertical-align:middle;">${etiqueta}</td>
        </tr></table>
      </td>
    </tr>`).join('')
}

// Botón CTA de ancho automático usado en los emails transaccionales (activación, recuperación).
function botonCTA({ url, texto, colorFondo = '#001430', colorTexto = '#ffffff' }) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="border-radius:10px;background:${colorFondo};">
          <a href="${url}"
            style="display:inline-block;padding:16px 36px;color:${colorTexto};font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            ${texto}
          </a>
        </td>
      </tr>
    </table>`
}

// Nota de expiración de enlaces de activación/recuperación.
function notaExpiracion(horas) {
  return `<p style="font-size:12px;color:#94a3b8;margin:14px 0 0;line-height:1.5;">
    🔒 Este enlace es personal e intransferible. Expira en <strong>${horas} horas</strong>.
  </p>`
}

// Fila de un movimiento de caja para la sección "Últimos movimientos" de los
// emails de capital (suspensión, reactivación) — compartida entre ambos templates.
// `esEvento` (SUSPENSION/REACTIVACION) no mueve dinero, se muestra sin signo/color.
function filaMovimientoCaja(m) {
  const fecha = new Date(m.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  if (m.esEvento) {
    return `
      <tr>
        <td colspan="2" style="padding:8px 0;font-size:13px;color:#475569;border-bottom:1px solid #e5eeff;">${m.etiquetaTipo}</td>
        <td style="padding:8px 0 8px 16px;font-size:12px;color:#94a3b8;text-align:right;border-bottom:1px solid #e5eeff;white-space:nowrap;">${fecha}</td>
      </tr>`
  }

  const signo = m.entrada ? '+' : '−'
  const color = m.entrada ? '#00C982' : '#EF4444'
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#475569;border-bottom:1px solid #e5eeff;">${m.etiquetaTipo}</td>
      <td style="padding:8px 0;font-size:13px;color:${color};font-weight:700;text-align:right;border-bottom:1px solid #e5eeff;">${signo} ${formatearPrecio(m.monto)}</td>
      <td style="padding:8px 0 8px 16px;font-size:12px;color:#94a3b8;text-align:right;border-bottom:1px solid #e5eeff;white-space:nowrap;">${fecha}</td>
    </tr>`
}

function generarFilasMovimientos(movimientos) {
  if (!movimientos.length) {
    return `<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:#94a3b8;">Sin movimientos registrados.</td></tr>`
  }
  return movimientos.map(filaMovimientoCaja).join('')
}

/**
 * Envuelve el contenido en el shell de email completo (outer table, header con logo, footer).
 * @param {string} accentColor  Color del borde inferior del encabezado
 * @param {string} filas        Filas <tr>...</tr> del cuerpo (entre cabecera y pie)
 */
function htmlBase({ accentColor = '#001430', filas }) {
  const anio = new Date().getFullYear()
  const appUrl = process.env.APP_URL ?? ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#eef2f7;padding:40px 16px;">
  <tr><td align="center">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
      style="max-width:600px;width:100%;">

      <!-- Encabezado de marca -->
      <tr>
        <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:20px 40px;border-bottom:3px solid ${accentColor};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;">
              <img src="${appUrl}/logotipo_sin%20slogan.webp" alt="GotaPay" width="140"
                style="display:block;height:auto;border:0;max-width:140px;" />
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:11px;font-weight:700;color:#001430;letter-spacing:0.08em;text-transform:uppercase;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                Crédito inteligente
              </span>
            </td>
          </tr></table>
        </td>
      </tr>

      ${filas}

      <!-- Pie de página -->
      <tr>
        <td style="background:#f8f9ff;border-radius:0 0 16px 16px;border-top:1px solid #e5eeff;padding:24px 40px;">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;text-align:center;line-height:1.6;">
            Si usted no esperaba este correo, puede ignorarlo — no pasará nada.
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

module.exports = { formatearPrecio, formatearLimite, generarFilasCaracteristicas, botonCTA, notaExpiracion, generarFilasMovimientos, htmlBase }
