'use strict'

const { htmlBase, formatearPrecio, generarFilasCaracteristicas } = require('./helpers')

function emailCambioPlan({ nombreCompleto, nombreNegocio, planAnterior, planNuevo }) {
  const precioNuevo    = formatearPrecio(Number(planNuevo.precio))
  const filasNuevoPlan = generarFilasCaracteristicas(planNuevo)

  const filas = `
    <!-- Cuerpo principal -->
    <tr>
      <td style="background:#ffffff;padding:40px 40px 32px;">

        <p style="font-size:11px;font-weight:700;color:#00C982;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">
          Cambio de plan
        </p>
        <h1 style="font-size:22px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          Tu plan ha sido actualizado
        </h1>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          Hola, <strong style="color:#001430;">${nombreCompleto}</strong>.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
          El plan de <strong style="color:#001430;">${nombreNegocio}</strong> ha cambiado.
          A continuación encontrarás los detalles de tu nueva suscripción.
        </p>

        <!-- Cambio de/a -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="margin-bottom:28px;">
          <tr>
            <!-- Plan anterior -->
            <td style="text-align:center;width:45%;background:#f8f9ff;border:1px solid #e5eeff;border-radius:10px;padding:14px 16px;">
              <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 5px;">Plan anterior</p>
              <p style="font-size:16px;font-weight:800;color:#64748B;margin:0;">${planAnterior?.nombre ?? '—'}</p>
            </td>
            <!-- Flecha -->
            <td style="text-align:center;width:10%;vertical-align:middle;">
              <span style="font-size:20px;color:#aac7fd;">→</span>
            </td>
            <!-- Plan nuevo -->
            <td style="text-align:center;width:45%;background:rgba(0,201,130,0.06);border:1px solid rgba(0,201,130,0.2);border-radius:10px;padding:14px 16px;">
              <p style="font-size:10px;font-weight:700;color:#00C982;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 5px;">Nuevo plan</p>
              <p style="font-size:16px;font-weight:800;color:#001430;margin:0;">${planNuevo.nombre}</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Separador -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <div style="height:1px;background:linear-gradient(to right,transparent,#e5eeff,transparent);"></div>
      </td>
    </tr>

    <!-- Tarjeta del nuevo plan -->
    <tr>
      <td style="background:#ffffff;padding:32px 40px;">
        <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px;">
          Detalles de tu nuevo plan
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#001430;border-radius:14px;overflow:hidden;">
          <!-- Header de la card -->
          <tr>
            <td style="padding:22px 26px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td>
                  <p style="font-size:11px;font-weight:600;color:#aac7fd;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Plan</p>
                  <p style="font-size:22px;font-weight:800;color:#ffffff;margin:0;letter-spacing:-0.02em;">${planNuevo.nombre}</p>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <p style="font-size:26px;font-weight:800;color:#00C982;margin:0;line-height:1;">${precioNuevo}</p>
                  <p style="font-size:11px;color:#475569;margin:4px 0 0;text-align:right;">/mes</p>
                </td>
              </tr></table>
            </td>
          </tr>
          <!-- Características -->
          <tr>
            <td style="padding:18px 26px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${filasNuevoPlan}
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Separador -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <div style="height:1px;background:linear-gradient(to right,transparent,#e5eeff,transparent);"></div>
      </td>
    </tr>

    <!-- Nota final -->
    <tr>
      <td style="background:#ffffff;padding:22px 40px 32px;">
        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">
          Este cambio fue aplicado por el equipo de administración de GotaPay.
          Si tienes alguna pregunta sobre tu nuevo plan, visita
          <a href="${process.env.APP_URL ?? ''}/soporte" style="color:#478dff;text-decoration:none;font-weight:600;">nuestro soporte</a>.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: '#001430', filas })
}

module.exports = { emailCambioPlan }
