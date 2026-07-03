'use strict'

const { htmlBase } = require('./helpers')

const CONFIG_ESTADO = {
  ACTIVO: {
    borde:    '#00C982',
    fondoPill: 'rgba(0,201,130,0.1)',
    textoPill: '#007146',
    etiqueta: 'Activo',
    titulo:   'Tu cuenta está activa',
    mensaje:  'Tu cuenta se encuentra completamente operativa. Ya puedes acceder al panel de GotaPay y gestionar tu cartera de crédito con total normalidad.',
  },
  PERIODO_GRACIA: {
    borde:    '#FBBF24',
    fondoPill: 'rgba(251,191,36,0.1)',
    textoPill: '#92400E',
    etiqueta: 'Período de gracia',
    titulo:   'Tu cuenta está en período de gracia',
    mensaje:  'Tu suscripción venció pero hemos activado un período de gracia para que puedas regularizar tu pago. Durante este tiempo el acceso puede estar limitado. Por favor, ponte al día para mantener el servicio sin interrupciones.',
  },
  SUSPENDIDO: {
    borde:    '#EF4444',
    fondoPill: 'rgba(239,68,68,0.08)',
    textoPill: '#991B1B',
    etiqueta: 'Suspendido',
    titulo:   'Tu cuenta ha sido suspendida',
    mensaje:  'Tu cuenta ha sido suspendida temporalmente. Durante este período no podrás acceder al panel de GotaPay. Si crees que esto es un error o deseas regularizar tu situación, nuestro equipo de soporte está listo para ayudarte.',
  },
  CANCELADO: {
    borde:    '#64748B',
    fondoPill: 'rgba(100,116,139,0.08)',
    textoPill: '#334155',
    etiqueta: 'Cancelado',
    titulo:   'Tu suscripción ha sido cancelada',
    mensaje:  'Tu suscripción a GotaPay ha sido cancelada. Tu información permanecerá disponible por un período adicional. Si esto fue un error o tienes preguntas sobre este proceso, no dudes en contactarnos.',
  },
}

function emailCambioEstado({ nombreCompleto, nombreNegocio, estadoAnterior, estadoNuevo }) {
  const c = CONFIG_ESTADO[estadoNuevo] ?? CONFIG_ESTADO.CANCELADO
  const cAnterior = CONFIG_ESTADO[estadoAnterior] ?? CONFIG_ESTADO.CANCELADO
  const appUrl = process.env.APP_URL ?? ''

  const bloqueSoporte = estadoNuevo === 'SUSPENDIDO' ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"
      style="margin-top:24px;width:100%;">
      <tr>
        <td style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:22px 24px;">
          <p style="font-size:13px;font-weight:700;color:#7F1D1D;margin:0 0 8px;">
            ¿Necesitas ayuda para resolver tu situación?
          </p>
          <p style="font-size:13px;color:#991B1B;margin:0 0 18px;line-height:1.6;">
            Nuestro equipo de soporte está disponible para ayudarte a regularizar tu cuenta
            y retomar el acceso lo antes posible.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#DC2626;border-radius:8px;">
                <a href="${appUrl}/soporte"
                  style="display:inline-block;padding:10px 22px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                  Contactar soporte →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : ''

  const filas = `
    <!-- Cuerpo principal -->
    <tr>
      <td style="background:#ffffff;padding:40px 40px 36px;">

        <!-- Pill de estado -->
        <div style="display:inline-block;background:${c.fondoPill};border:1px solid ${c.borde}33;border-radius:9999px;padding:6px 18px;margin-bottom:22px;">
          <span style="font-size:11px;font-weight:700;color:${c.textoPill};text-transform:uppercase;letter-spacing:0.09em;">
            ${c.etiqueta}
          </span>
        </div>

        <h1 style="font-size:22px;font-weight:800;color:#001430;margin:0 0 12px;line-height:1.3;letter-spacing:-0.01em;">
          ${c.titulo}
        </h1>

        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 10px;">
          Hola, <strong style="color:#001430;">${nombreCompleto}</strong>.
        </p>
        <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 16px;">
          El estado de la cuenta <strong style="color:#001430;">${nombreNegocio}</strong> en GotaPay cambió de
          <span style="font-weight:600;color:#64748B;">${cAnterior.etiqueta}</span> a
          <span style="font-weight:700;color:${c.textoPill};">${c.etiqueta}</span>.
        </p>
        <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0;">
          ${c.mensaje}
        </p>

        ${bloqueSoporte}

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
          Si tienes alguna pregunta, responde a este correo o visita
          <a href="${appUrl}/soporte" style="color:#478dff;text-decoration:none;font-weight:600;">nuestro soporte</a>.
        </p>
      </td>
    </tr>`

  return htmlBase({ accentColor: c.borde, filas })
}

module.exports = { emailCambioEstado }
