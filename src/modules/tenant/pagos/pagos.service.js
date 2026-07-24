'use strict'

const { v7: uuidv7 } = require('uuid')
const { Prisma } = require('@prisma/client')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { generarTokenVerificacion } = require('../../../lib/tokenVerificacion')
const { urlVerificacion, generarQrPngBuffer } = require('../../../lib/qr')
const { calcularAplicacionPago } = require('../../../lib/aplicacionPago')
const { calcularResumenCredito } = require('../../../lib/calculoCredito')
const { calcularEstadoMoraDe } = require('../../../lib/calculoMora')
const { generarVoucherPago } = require('../../../lib/pdf/voucherPago')
const { ESTADOS_CREDITO_ACTIVOS } = require('../../../lib/creditosConstantes')
const {
  abonosPorCreditoDe, pendientesInteresCapitalDe, estadoCuotasDe, estadoPeriodoSoloInteresesDe,
  codigoPrestamoDe, montoVencidoSinPagarDe, proximaFechaCuotaDe,
} = require('../creditos/creditos.service')
const { anexarCalculados: anexarCalculadosCaja } = require('../capital/capital.service')
const { parsearPaginacion } = require('../../../lib/paginacion')

const SELECT_CREDITO_PAGO = {
  id: true, tenantId: true, clienteId: true, cajaId: true, montoInicial: true, tasaInteres: true,
  numeroCuotas: true, frecuenciaPago: true, fechaInicio: true, redondearCuotaMil: true, estado: true,
  plantillaId: true, createdAt: true,
  cliente: { select: { clienteGlobal: { select: { nombreCompleto: true } } } },
}

// true en producción: todo pago registrado queda PENDIENTE_LIQUIDAR hasta que
// un administrador lo liquide aparte (CLAUDE.md §7 — un pago pendiente no
// afecta el saldo del crédito). false o sin definir: modo de prueba, cada
// pago se aplica y liquida en el mismo paso — así se puede probar el motor de
// aplicación (recargos → interés → capital) sin generar trabajo manual extra.
function requiereLiquidacionManual() {
  return process.env.PAGOS_REQUIERE_LIQUIDACION === 'true'
}

// Calcula cómo se repartiría un abono HOY, sin persistir nada — usado tanto
// por simularPago (vista previa en el modal) como por registrarPago (el
// cálculo real que se guarda). Plazo fijo: se pasan TODAS las cuotas
// (vencidas y futuras) para que el motor (src/lib/aplicacionPago.js) aplique
// el sobrante automáticamente a la siguiente cuota futura (PASO 3 de la spec
// del usuario, sin preguntar nada). Solo intereses: el capital queda
// deliberadamente fuera del reparto automático (capitalPendiente=0 en la
// "cuota virtual") — cualquier sobrante después de recargos+interés dispara
// requiereDecisionSobrante, y el operador elige destino (capital o próximas
// cuotas, PARTE 3) antes de poder registrar.
async function calcularSimulacion(tenantId, creditoId, montoRecibido, sobranteDestino) {
  const credito = await prisma.credito.findFirst({ where: { id: creditoId, tenantId }, select: SELECT_CREDITO_PAGO })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }
  if (!ESTADOS_CREDITO_ACTIVOS.includes(credito.estado)) {
    return { error: 'Este crédito no admite pagos en su estado actual.', status: 422 }
  }

  if (credito.numeroCuotas === 0) {
    const periodo = await estadoPeriodoSoloInteresesDe(tenantId, credito)
    const cuotaVirtual = {
      numero: null, fecha: null, pagada: false,
      recargosPendientes: periodo.recargosPendientes,
      interesPendiente: periodo.interesPendiente,
      capitalPendiente: new Prisma.Decimal(0),
    }
    const aplicacion = calcularAplicacionPago({ montoRecibido, cuotas: [cuotaVirtual] })

    if (aplicacion.sobrante.gt(0)) {
      if (!sobranteDestino) return { credito, aplicacion, requiereDecisionSobrante: true }

      aplicacion.aplicacionPorCuota.push({
        numero: null, fecha: null,
        valorRecargos: new Prisma.Decimal(0),
        valorIntereses: sobranteDestino === 'PROXIMAS_CUOTAS' ? aplicacion.sobrante : new Prisma.Decimal(0),
        valorCapital: sobranteDestino === 'CAPITAL' ? aplicacion.sobrante : new Prisma.Decimal(0),
        totalAplicado: aplicacion.sobrante,
        quedaPagada: false,
      })
      aplicacion.totalAplicado = aplicacion.totalAplicado.plus(aplicacion.sobrante)
      aplicacion.sobrante = new Prisma.Decimal(0)
    }

    return { credito, aplicacion }
  }

  const cuotas = await estadoCuotasDe(tenantId, credito)
  const aplicacion = calcularAplicacionPago({ montoRecibido, cuotas })
  return { credito, aplicacion }
}

// POST /pagos/simular — vista previa en vivo del reparto recargos → interés →
// capital, cuota por cuota, antes de que el operador confirme el modal
// "Registrar pago". Mismo patrón que POST /creditos/simular (sin persistir
// nada, deliberadamente permisivo con montos incompletos mientras el
// operador escribe).
async function simularPago(req) {
  const { tenantId } = req.empleado
  const { creditoId, montoRecibido, sobranteDestino } = req.body

  const monto = Number(montoRecibido)
  if (!creditoId || !(monto > 0)) {
    return { aplicacionPorCuota: [], totalAplicado: 0, sobrante: 0, requiereDecisionSobrante: false }
  }

  const resultado = await calcularSimulacion(tenantId, creditoId, monto, sobranteDestino)
  if (resultado.error) return resultado

  const { aplicacion, requiereDecisionSobrante } = resultado
  return {
    aplicacionPorCuota: aplicacion.aplicacionPorCuota.map(c => ({
      numero: c.numero,
      fecha: c.fecha,
      valorRecargos: c.valorRecargos.toNumber(),
      valorIntereses: c.valorIntereses.toNumber(),
      valorCapital: c.valorCapital.toNumber(),
      totalAplicado: c.totalAplicado.toNumber(),
    })),
    totalAplicado: aplicacion.totalAplicado.toNumber(),
    sobrante: aplicacion.sobrante.toNumber(),
    requiereDecisionSobrante: !!requiereDecisionSobrante,
  }
}

// Efectos de un pago que PASA A (o nace) LIQUIDADO: mueve la caja y
// recalcula el estado del crédito. Compartida entre registrarPago (modo de
// prueba, liquida de inmediato) y liquidarPago (modo producción, liquida
// aparte) — debe correr dentro de la MISMA transacción que dejó el Pago en
// estado LIQUIDADO.
async function aplicarEfectosLiquidacion(tx, { credito, totalAplicado, tenantId, autorId, pagoId, fecha }) {
  const caja = await prisma.caja.findFirst({
    where: { id: credito.cajaId, tenantId },
    include: { socio: { select: { id: true, nombreCompleto: true } } },
  })
  const [cajaCalculada] = await anexarCalculadosCaja([caja], tenantId)
  const nuevoDisponible = new Prisma.Decimal(cajaCalculada.disponible).plus(totalAplicado)

  await tx.movimientoCaja.create({
    data: {
      id: uuidv7(), tenantId, cajaId: credito.cajaId, tipo: 'PAGO_RECIBIDO',
      monto: totalAplicado, referenciaId: pagoId, referenciaTipo: 'Pago',
      saldoDespuesMovimiento: nuevoDisponible, registradoPorId: autorId, fecha,
      observaciones: `Abono recibido — crédito ${credito.id}`,
    },
  })

  const abonoTrasPago = await tx.distribucionPago.aggregate({
    where: { tenantId, creditoId: credito.id, pago: { estado: 'LIQUIDADO' } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  const montoPagadoTotal = new Prisma.Decimal(abonoTrasPago._sum.valorCapital ?? 0).plus(abonoTrasPago._sum.valorIntereses ?? 0)

  let nuevoEstadoCredito = calcularEstadoMoraDe(credito, montoPagadoTotal)
  if (credito.numeroCuotas > 0) {
    const { totalAPagar } = calcularResumenCredito({
      montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: credito.numeroCuotas,
      frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
    })
    if (montoPagadoTotal.gte(totalAPagar)) nuevoEstadoCredito = 'PAGADO'
  }
  if (nuevoEstadoCredito !== credito.estado) {
    await tx.credito.update({ where: { id: credito.id }, data: { estado: nuevoEstadoCredito } })
  }
}

// Genera el voucher PDF de un pago ya LIQUIDADO (PARTE 5 de la spec). Nunca
// lleva marca/logo/firma del tenant — solo datos de la transacción. Si algo
// falla acá, el pago ya es un hecho consumado (igual que el PDF de resumen al
// crear un préstamo): se informa el error pero no se revierte nada.
async function generarVoucherDelPago({ tenantId, creditoId, pagoId, montoRecibido, metodoPago, tokenVerificacion, fecha, autorId, role, cuotas, saldoAnterior, saldoNuevo }) {
  try {
    const [creditoActualizado, autor] = await Promise.all([
      prisma.credito.findFirst({ where: { id: creditoId, tenantId }, select: SELECT_CREDITO_PAGO }),
      prisma.empleado.findFirst({ where: { id: autorId, tenantId }, select: { nombreCompleto: true } }),
    ])
    const abonoActualizado = (await abonosPorCreditoDe(tenantId, [creditoId])).get(creditoId)
    const vencidoSinPagar = montoVencidoSinPagarDe(creditoActualizado, abonoActualizado)
    const alDia = vencidoSinPagar.lte(0)

    let proximaCuota = null
    if (alDia && !['PAGADO', 'CASTIGADO', 'REFINANCIADO'].includes(creditoActualizado.estado)) {
      const fechaProxima = proximaFechaCuotaDe(creditoActualizado)
      const resumen = calcularResumenCredito({
        montoInicial: creditoActualizado.montoInicial, tasaInteres: creditoActualizado.tasaInteres,
        numeroCuotas: creditoActualizado.numeroCuotas, frecuenciaPago: creditoActualizado.frecuenciaPago,
        fechaInicio: creditoActualizado.fechaInicio, redondearCuotaMil: creditoActualizado.redondearCuotaMil,
      })
      const valor = creditoActualizado.numeroCuotas === 0 ? resumen.valorPeriodico : resumen.valorCuota
      if (fechaProxima && valor) {
        proximaCuota = { valor: valor.toNumber(), fecha: fechaProxima.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
      }
    }

    const urlDoc = urlVerificacion(tokenVerificacion)
    const qrPngBuffer = await generarQrPngBuffer(urlDoc)

    const pdfBuffer = await generarVoucherPago({
      codigoPrestamo: codigoPrestamoDe(creditoActualizado),
      clienteNombre: creditoActualizado.cliente.clienteGlobal.nombreCompleto,
      fecha: fecha.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      registradoPor: role === 'COBRADOR' ? (autor?.nombreCompleto ?? null) : null,
      saldoAnterior, montoRecibido: Number(montoRecibido), saldoNuevo,
      cuotas,
      alDia,
      proximaCuota,
      saldoVencidoPendiente: vencidoSinPagar.toNumber(),
      qrPngDataUri: `data:image/png;base64,${qrPngBuffer.toString('base64')}`,
    })
    return pdfBuffer.toString('base64')
  } catch (err) {
    console.error('[Voucher] Error generando comprobante de pago', pagoId, ':', err.message)
    return null
  }
}

// POST /pagos — registra un abono. Su reparto (recargos → interés → capital,
// cuota por cuota, de más vieja a más nueva) lo decide siempre el motor de
// aplicacionPago.js: no recibe "para qué cuota es", así que saltarse una
// cuota no saldada es estructuralmente imposible. Si PAGOS_REQUIERE_LIQUIDACION
// no está en 'true' (modo de prueba), el pago se aplica y liquida en el mismo
// paso; si está en 'true' (producción), queda PENDIENTE_LIQUIDAR y espera a
// que un administrador lo liquide con POST /pagos/:id/liquidar — mientras
// tanto no afecta caja ni saldo del crédito (CLAUDE.md §7).
async function registrarPago(req) {
  const { tenantId, id: autorId, role } = req.empleado
  const { creditoId, montoRecibido, metodoPago, sobranteDestino } = req.body

  const resultado = await calcularSimulacion(tenantId, creditoId, montoRecibido, sobranteDestino)
  if (resultado.error) return resultado

  const { credito, aplicacion, requiereDecisionSobrante } = resultado
  if (requiereDecisionSobrante) {
    return {
      error: 'Este abono deja un sobrante. Indica si se aplica a capital o a las próximas cuotas.',
      status: 422,
      requiereDecisionSobrante: true,
      sobrante: aplicacion.sobrante.toNumber(),
    }
  }
  if (aplicacion.totalAplicado.lte(0)) {
    return { error: 'Este crédito no tiene saldo pendiente.', status: 422 }
  }

  // Saldo (interés + capital, sin contar recargos — CLAUDE.md §4 saldo nunca
  // persistido) antes y después de este abono, para el voucher.
  const abonoPorCreditoAntes = await abonosPorCreditoDe(tenantId, [creditoId])
  const { interesPendiente: interesAntes, capitalPendiente: capitalAntes } =
    pendientesInteresCapitalDe(credito, abonoPorCreditoAntes.get(creditoId))
  const saldoAnterior = interesAntes.plus(capitalAntes)
  const interesCapitalAplicado = aplicacion.aplicacionPorCuota.reduce(
    (acc, c) => acc.plus(c.valorIntereses).plus(c.valorCapital), new Prisma.Decimal(0)
  )
  const saldoNuevo = Prisma.Decimal.max(saldoAnterior.minus(interesCapitalAplicado), 0)

  const pagoId = uuidv7()
  const fecha = new Date()

  // Tipo derivado del resultado, nunca elegido por el operador. PAGO_TOTAL:
  // no queda nada pendiente (interés+capital) en el crédito tras este abono.
  // PAGO_CUOTA: al menos una cuota quedó completamente saldada con este
  // abono. Lo demás, abono parcial.
  const tipo = saldoNuevo.lte(0)
    ? 'PAGO_TOTAL'
    : aplicacion.aplicacionPorCuota.some(c => c.quedaPagada)
      ? 'PAGO_CUOTA'
      : 'ABONO_PARCIAL'

  const liquidarDeInmediato = !requiereLiquidacionManual()
  const tokenVerificacion = liquidarDeInmediato ? generarTokenVerificacion() : null

  await prisma.$transaction(async tx => {
    await tx.pago.create({
      data: {
        id: pagoId, tenantId, creditoId, clienteId: credito.clienteId, empleadoId: autorId,
        montoRecibido, metodoPago, tipo,
        estado: liquidarDeInmediato ? 'LIQUIDADO' : 'PENDIENTE_LIQUIDAR',
        fechaRegistro: fecha,
        fechaLiquidacion: liquidarDeInmediato ? fecha : null,
        liquidadoPorId: liquidarDeInmediato ? autorId : null,
        tokenVerificacion,
      },
    })

    for (const c of aplicacion.aplicacionPorCuota) {
      await tx.distribucionPago.create({
        data: {
          id: uuidv7(), tenantId, pagoId, creditoId,
          numeroCuota: c.numero ?? null,
          fechaCuota: c.fecha ?? null,
          valorRecargos: c.valorRecargos,
          valorIntereses: c.valorIntereses,
          valorCapital: c.valorCapital,
          totalAplicado: c.totalAplicado,
        },
      })
    }

    if (liquidarDeInmediato) {
      await aplicarEfectosLiquidacion(tx, { credito, totalAplicado: aplicacion.totalAplicado, tenantId, autorId, pagoId, fecha })
    }
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'PAGO_REGISTRADO',
    entidadTipo: 'Pago',
    entidadId: pagoId,
    valorNuevo: {
      creditoId, montoRecibido, metodoPago, tipo,
      estado: liquidarDeInmediato ? 'LIQUIDADO' : 'PENDIENTE_LIQUIDAR',
      cuotas: aplicacion.aplicacionPorCuota.map(c => ({
        numero: c.numero,
        valorRecargos: c.valorRecargos.toNumber(),
        valorIntereses: c.valorIntereses.toNumber(),
        valorCapital: c.valorCapital.toNumber(),
      })),
    },
  })

  const cuotasVoucher = aplicacion.aplicacionPorCuota.map(c => ({
    numero: c.numero,
    fecha: c.fecha ? c.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null,
    valorRecargos: c.valorRecargos.toNumber(),
    valorIntereses: c.valorIntereses.toNumber(),
    valorCapital: c.valorCapital.toNumber(),
    totalAplicado: c.totalAplicado.toNumber(),
  }))

  const voucherPdfBase64 = liquidarDeInmediato
    ? await generarVoucherDelPago({
        tenantId, creditoId, pagoId, montoRecibido, metodoPago, tokenVerificacion, fecha, autorId, role,
        cuotas: cuotasVoucher, saldoAnterior: saldoAnterior.toNumber(), saldoNuevo: saldoNuevo.toNumber(),
      })
    : null

  return {
    pago: {
      id: pagoId, creditoId, montoRecibido, metodoPago, tipo,
      estado: liquidarDeInmediato ? 'LIQUIDADO' : 'PENDIENTE_LIQUIDAR',
      voucherPdfBase64,
      distribucion: aplicacion.aplicacionPorCuota.map(c => ({
        numero: c.numero,
        valorRecargos: c.valorRecargos.toNumber(),
        valorIntereses: c.valorIntereses.toNumber(),
        valorCapital: c.valorCapital.toNumber(),
        totalAplicado: c.totalAplicado.toNumber(),
      })),
    },
  }
}

// POST /pagos/:id/liquidar — pasa un pago de PENDIENTE_LIQUIDAR a LIQUIDADO:
// recién ahí afecta la caja y el saldo del crédito (CLAUDE.md §7), y genera
// su token de verificación + voucher (nunca antes — CLAUDE.md §12: el token
// se genera en la misma transacción que crea o actualiza el documento
// oficial, y el documento oficial de un pago es el pago ya liquidado).
async function liquidarPago(req) {
  const { tenantId, id: autorId, role } = req.empleado
  const { id: pagoId } = req.params

  const pago = await prisma.pago.findFirst({ where: { id: pagoId, tenantId }, include: { distribuciones: true } })
  if (!pago) return { error: 'Pago no encontrado', status: 404 }
  if (pago.estado !== 'PENDIENTE_LIQUIDAR') return { error: 'Este pago ya fue procesado.', status: 422 }

  const credito = await prisma.credito.findFirst({ where: { id: pago.creditoId, tenantId }, select: SELECT_CREDITO_PAGO })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const abonoPorCreditoAntes = await abonosPorCreditoDe(tenantId, [credito.id])
  const { interesPendiente: interesAntes, capitalPendiente: capitalAntes } =
    pendientesInteresCapitalDe(credito, abonoPorCreditoAntes.get(credito.id))
  const saldoAnterior = interesAntes.plus(capitalAntes)
  const totalAplicado = pago.distribuciones.reduce((acc, d) => acc.plus(d.totalAplicado), new Prisma.Decimal(0))
  const interesCapitalAplicado = pago.distribuciones.reduce((acc, d) => acc.plus(d.valorIntereses).plus(d.valorCapital), new Prisma.Decimal(0))
  const saldoNuevo = Prisma.Decimal.max(saldoAnterior.minus(interesCapitalAplicado), 0)

  const fecha = new Date()
  const tokenVerificacion = generarTokenVerificacion()

  await prisma.$transaction(async tx => {
    await tx.pago.update({
      where: { id: pagoId },
      data: { estado: 'LIQUIDADO', fechaLiquidacion: fecha, liquidadoPorId: autorId, tokenVerificacion },
    })
    await aplicarEfectosLiquidacion(tx, { credito, totalAplicado, tenantId, autorId, pagoId, fecha })
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'PAGO_LIQUIDADO',
    entidadTipo: 'Pago',
    entidadId: pagoId,
    valorAnterior: { estado: 'PENDIENTE_LIQUIDAR' },
    valorNuevo: { estado: 'LIQUIDADO' },
  })

  const cuotasVoucher = pago.distribuciones.map(d => ({
    numero: d.numeroCuota,
    fecha: d.fechaCuota ? d.fechaCuota.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null,
    valorRecargos: d.valorRecargos.toNumber(),
    valorIntereses: d.valorIntereses.toNumber(),
    valorCapital: d.valorCapital.toNumber(),
    totalAplicado: d.totalAplicado.toNumber(),
  }))

  const voucherPdfBase64 = await generarVoucherDelPago({
    tenantId, creditoId: credito.id, pagoId, montoRecibido: pago.montoRecibido, metodoPago: pago.metodoPago,
    tokenVerificacion, fecha, autorId, role, cuotas: cuotasVoucher,
    saldoAnterior: saldoAnterior.toNumber(), saldoNuevo: saldoNuevo.toNumber(),
  })

  return { pago: { id: pagoId, estado: 'LIQUIDADO', voucherPdfBase64 } }
}

const ETIQUETAS_TIPO_PAGO = {
  PAGO_CUOTA: 'Pago cuota',
  ABONO_PARCIAL: 'Abono parcial',
  PAGO_TOTAL: 'Pago total',
  PAGO_MULTIPLES_CREDITOS: 'Pago múltiples créditos',
  PAGO_COMPROBANTE_ADMIN: 'Comprobante admin',
}

// GET /pagos/credito/:creditoId — pestaña "Pagos realizados" del detalle de
// préstamo.
async function listarPagosCredito(req) {
  const { tenantId } = req.empleado
  const { creditoId } = req.params
  const { paginaNum, porPaginaNum } = parsearPaginacion(req.query)

  const credito = await prisma.credito.findFirst({ where: { id: creditoId, tenantId }, select: { id: true } })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const [pagos, total] = await Promise.all([
    prisma.pago.findMany({
      where: { tenantId, creditoId },
      include: { distribuciones: true, empleado: { select: { nombreCompleto: true } } },
      orderBy: { fechaRegistro: 'desc' },
      skip: (paginaNum - 1) * porPaginaNum,
      take: porPaginaNum,
    }),
    prisma.pago.count({ where: { tenantId, creditoId } }),
  ])

  return {
    pagos: pagos.map(p => ({
      id: p.id,
      fecha: p.fechaLiquidacion ?? p.fechaRegistro,
      tipo: p.tipo,
      etiquetaTipo: ETIQUETAS_TIPO_PAGO[p.tipo] ?? p.tipo,
      montoRecibido: p.montoRecibido,
      metodoPago: p.metodoPago,
      estado: p.estado,
      registradoPor: p.empleado.nombreCompleto,
      distribuciones: p.distribuciones,
    })),
    total,
    pagina: paginaNum,
    porPagina: porPaginaNum,
    totalPaginas: Math.max(1, Math.ceil(total / porPaginaNum)),
  }
}

// GET /pagos/:id/voucher — reimprime el comprobante de un pago ya LIQUIDADO
// (botón "Imprimir voucher" junto a una cuota "Pagada" en el Plan de pagos).
// El PDF nunca se persiste (CLAUDE.md §4) — se regenera cada vez con los
// mismos datos históricos: reconstruye saldoAnterior/saldoNuevo usando solo
// los pagos LIQUIDADO anteriores a este (mismo criterio temporal que usó
// registrarPago la primera vez), y usa el rol de quien REGISTRÓ el pago
// (no el de quien lo reimprime) para decidir si el voucher lleva su nombre o
// "Registrado por administración".
async function regenerarVoucherPago(req) {
  const { tenantId } = req.empleado
  const { id: pagoId } = req.params

  const pago = await prisma.pago.findFirst({
    where: { id: pagoId, tenantId, estado: 'LIQUIDADO' },
    include: { distribuciones: true },
  })
  if (!pago) return { error: 'Pago no encontrado', status: 404 }

  const [credito, autor] = await Promise.all([
    prisma.credito.findFirst({ where: { id: pago.creditoId, tenantId }, select: SELECT_CREDITO_PAGO }),
    prisma.empleado.findFirst({ where: { id: pago.empleadoId, tenantId }, include: { rol: { select: { nombre: true } } } }),
  ])
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const abonoAntes = await prisma.distribucionPago.aggregate({
    where: { tenantId, creditoId: credito.id, pago: { estado: 'LIQUIDADO', fechaRegistro: { lt: pago.fechaRegistro } } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  const { interesPendiente: interesAntes, capitalPendiente: capitalAntes } =
    pendientesInteresCapitalDe(credito, abonoAntes._sum)
  const saldoAnterior = interesAntes.plus(capitalAntes)
  const interesCapitalAplicado = pago.distribuciones.reduce(
    (acc, d) => acc.plus(d.valorIntereses).plus(d.valorCapital), new Prisma.Decimal(0)
  )
  const saldoNuevo = Prisma.Decimal.max(saldoAnterior.minus(interesCapitalAplicado), 0)

  const cuotasVoucher = pago.distribuciones.map(d => ({
    numero: d.numeroCuota,
    fecha: d.fechaCuota ? d.fechaCuota.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null,
    valorRecargos: d.valorRecargos.toNumber(),
    valorIntereses: d.valorIntereses.toNumber(),
    valorCapital: d.valorCapital.toNumber(),
    totalAplicado: d.totalAplicado.toNumber(),
  }))

  const voucherPdfBase64 = await generarVoucherDelPago({
    tenantId, creditoId: credito.id, pagoId, montoRecibido: pago.montoRecibido, metodoPago: pago.metodoPago,
    tokenVerificacion: pago.tokenVerificacion, fecha: pago.fechaLiquidacion, autorId: pago.empleadoId,
    role: autor?.rol?.nombre ?? null, cuotas: cuotasVoucher,
    saldoAnterior: saldoAnterior.toNumber(), saldoNuevo: saldoNuevo.toNumber(),
  })
  if (!voucherPdfBase64) return { error: 'No se pudo generar el comprobante.', status: 500 }

  return { voucherPdfBase64 }
}

module.exports = { simularPago, registrarPago, liquidarPago, listarPagosCredito, regenerarVoucherPago }
