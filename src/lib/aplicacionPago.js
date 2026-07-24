'use strict'

const { Prisma } = require('@prisma/client')

// Reparte un abono cuota por cuota, de más antigua a más reciente — dentro de
// CADA cuota, siempre recargos → interés → capital, sin excepciones (spec del
// usuario 2026-07-23). Nunca salta a la siguiente cuota si la actual quedó
// con saldo pendiente, salvo que el dinero se agote (entonces esa cuota queda
// con abono parcial y el reparto termina ahí). `cuotas` ya viene con el
// pendiente de cada categoría resuelto en vivo (ver estadoCuotasDe en
// creditos.service.js) — esta función es pura, sin acceso a BD.
//
// Si el abono alcanza para cubrir TODAS las cuotas recibidas y todavía sobra
// dinero, el sobrante se devuelve aparte — nunca se pierde silenciosamente.
// Quien llama decide qué hacer con el sobrante: en un crédito de plazo fijo
// se le pasan también las cuotas futuras (se siguen llenando con el mismo
// orden, PASO 3 de la spec); en uno de solo intereses, el sobrante dispara
// una pregunta al operador (capital vs. próximas cuotas) antes de aplicarse
// — ver pagos.service.js.
function calcularAplicacionPago({ montoRecibido, cuotas }) {
  let restante = new Prisma.Decimal(montoRecibido)

  function aplicarA(pendiente) {
    const monto = Prisma.Decimal.min(restante, Prisma.Decimal.max(pendiente, 0))
    restante = restante.minus(monto)
    return monto
  }

  const aplicacionPorCuota = []

  for (const cuota of cuotas) {
    if (restante.lte(0)) break
    if (cuota.pagada) continue

    const valorRecargos = aplicarA(cuota.recargosPendientes)
    const valorIntereses = aplicarA(cuota.interesPendiente)
    const valorCapital = aplicarA(cuota.capitalPendiente)
    const totalAplicado = valorRecargos.plus(valorIntereses).plus(valorCapital)

    if (totalAplicado.lte(0)) continue

    aplicacionPorCuota.push({
      numero: cuota.numero,
      fecha: cuota.fecha,
      valorRecargos,
      valorIntereses,
      valorCapital,
      totalAplicado,
      quedaPagada: valorCapital.gte(cuota.capitalPendiente)
        && valorIntereses.gte(cuota.interesPendiente)
        && valorRecargos.gte(cuota.recargosPendientes),
    })
  }

  const totalAplicado = new Prisma.Decimal(montoRecibido).minus(restante)
  return { aplicacionPorCuota, totalAplicado, sobrante: restante }
}

module.exports = { calcularAplicacionPago }
