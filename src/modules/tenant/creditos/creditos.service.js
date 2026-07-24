'use strict'

const { v7: uuidv7 } = require('uuid')
const { Prisma } = require('@prisma/client')
const prisma = require('../../../lib/prisma')
const { ESTADOS_CREDITO_ACTIVOS, ESTADOS_CREDITO_MORA, DIAS_POR_FRECUENCIA, UNIDADES_PLAZO } = require('../../../lib/creditosConstantes')
const { calcularResumenCredito, calcularCronogramaCredito, periodosTranscurridosDe, inicioDeHoy } = require('../../../lib/calculoCredito')
const { moraPorCuotaDe } = require('../../../lib/calculoMora')
const { resolverConfigMora } = require('../../../lib/configMora')
const { parsearPaginacion } = require('../../../lib/paginacion')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { obtenerUsoLimitePrestamos, errorLimiteAlcanzado } = require('../../../lib/limitesPlan')
const { subirDocumento, ErrorDocumento, SELECT_DOCUMENTO, serializarDocumento } = require('../../../lib/documentos')
const { generarUrlDescargaR2 } = require('../../../lib/r2Client')
const { anexarCalculados: anexarCalculadosCaja } = require('../capital/capital.service')
const { esquemaGarantia, esquemaDeudorSolidario } = require('./creditos.validator')
const { generarTokenVerificacion } = require('../../../lib/tokenVerificacion')
const { generarQrPngBuffer, urlVerificacion } = require('../../../lib/qr')
const { generarPdfResumenPrestamo } = require('../../../lib/pdf/resumenPrestamo')
const { emailResumenPrestamo } = require('../../../emails/resumenPrestamo')
const { enviarEmail } = require('../../../lib/email')

const INCLUDE_CLIENTE_COBRADOR = {
  cliente: { include: { clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true } } } },
  cobrador: { select: { id: true, nombreCompleto: true } },
}

// Aproximación real (no ficticia) de días de mora: usa fechaVencimiento del
// crédito completo, no un cronograma de cuotas individual (todavía no existe).
// Un crédito recién marcado EN_MORA cuya fechaVencimiento aún no llegó muestra 0
// — es una simplificación a nivel de crédito completo, documentada, mientras se
// construye el motor de cuotas real. Los créditos de solo intereses
// (numeroCuotas = 0) no tienen fechaVencimiento — no hay "vencimiento del
// plazo" que calcular, así que siempre muestran 0 acá (la mora de un pago de
// interés periódico específico es un concepto distinto, aún no construido).
function diasMoraDe(credito) {
  if (!ESTADOS_CREDITO_MORA.includes(credito.estado)) return 0
  if (!credito.fechaVencimiento) return 0
  const dias = Math.floor((inicioDeHoy().getTime() - new Date(credito.fechaVencimiento).getTime()) / 86_400_000)
  return Math.max(0, dias)
}

// Próxima fecha de cuota según el cronograma contractual (fechaInicio +
// cadencia de frecuenciaPago) — asume que las cuotas anteriores a hoy ya se
// pagaron a tiempo; no descuenta pagos reales recibidos ni atrasos (eso
// requiere el cronograma de cuotas real, que aún no existe). Sirve como
// aproximación de "cuándo toca la próxima" mientras se construye ese módulo.
//
// Créditos de solo intereses (numeroCuotas = 0): no hay una cuota final, pero
// SÍ hay un cobro periódico de interés — se busca hacia adelante desde
// fechaInicio hasta la primera fecha aún no vencida, indefinidamente.
function proximaFechaCuotaDe(credito) {
  const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
  const hoy = inicioDeHoy().getTime()

  if (credito.numeroCuotas === 0) {
    if (!dias) return null
    const fecha = new Date(credito.fechaInicio)
    while (fecha.getTime() < hoy) fecha.setDate(fecha.getDate() + dias)
    return fecha
  }

  for (let i = 1; i <= credito.numeroCuotas; i++) {
    const fecha = new Date(credito.fechaInicio)
    fecha.setDate(fecha.getDate() + dias * i)
    if (fecha.getTime() >= hoy) return fecha
  }
  return credito.fechaVencimiento
}

// Cuotas que todavía no vencen, contadas con la misma aproximación de
// calendario contractual que proximaFechaCuotaDe (sin cronograma de cuotas
// real todavía). Créditos de solo intereses (numeroCuotas = 0) no tienen un
// número de cuotas finito — devuelve -1 (misma convención de "ilimitado" que
// los límites de Plan, ver formatearLimite en frontend/src/lib/formato.js).
function cuotasFaltantesDe(credito) {
  if (credito.numeroCuotas === 0) return -1

  const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
  if (!dias) return credito.numeroCuotas

  const hoy = inicioDeHoy().getTime()
  let restantes = 0
  for (let i = 1; i <= credito.numeroCuotas; i++) {
    const fecha = new Date(credito.fechaInicio)
    fecha.setDate(fecha.getDate() + dias * i)
    if (fecha.getTime() >= hoy) restantes++
  }
  return restantes
}

// Abonos (capital + intereses) ya liquidados por crédito — fuente única para
// saldo de capital (anexarSaldoCapital), desglose interés/capital pendiente
// (pendientesInteresCapitalDe, usado por el motor de aplicación de pago en
// src/modules/tenant/pagos/pagos.service.js) y el job de mora
// (mora.worker.js). Nunca filtra por menos de tenantId+creditoId juntos.
//
// `pago: { estado: 'LIQUIDADO' }` es obligatorio: un Pago PENDIENTE_LIQUIDAR
// ya tiene su DistribucionPago creada (pagos.service.js/registrarPago), pero
// CLAUDE.md §7 exige que NO afecte el saldo hasta liquidarse — sin este
// filtro, registrar un pago (sin liquidarlo) ya reduciría el pendiente.
async function abonosPorCreditoDe(tenantId, creditoIds) {
  if (creditoIds.length === 0) return new Map()
  const abonos = await prisma.distribucionPago.groupBy({
    by: ['creditoId'],
    where: { tenantId, creditoId: { in: creditoIds }, pago: { estado: 'LIQUIDADO' } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  return new Map(abonos.map(a => [a.creditoId, a._sum]))
}

// Saldo de capital pendiente (montoInicial - abonos a capital ya liquidados),
// excluyendo intereses/mora/recargos.
async function anexarSaldoCapital(creditos, tenantId) {
  const ids = creditos.map(c => c.id)
  if (ids.length === 0) return []

  const abonoPorCredito = await abonosPorCreditoDe(tenantId, ids)

  return creditos.map(c => ({
    ...c,
    // Aritmética con Prisma.Decimal, nunca +/- nativos de JS (CLAUDE.md §4).
    saldo: new Prisma.Decimal(c.montoInicial).minus(abonoPorCredito.get(c.id)?.valorCapital ?? 0),
  }))
}

// Interés y capital pendientes de un crédito activo, calculados por separado
// (a diferencia de owedDeCredito en clientes.service.js, que los suma en un
// solo número) — insumo del motor de aplicación de pago
// (src/lib/aplicacionPago.js), que reparte mora/recargos/interés/capital en
// pasos independientes y necesita saber cuánto queda de cada uno.
function pendientesInteresCapitalDe(credito, abono) {
  const capitalPagado = new Prisma.Decimal(abono?.valorCapital ?? 0)
  const interesesPagados = new Prisma.Decimal(abono?.valorIntereses ?? 0)
  const capitalPendiente = Prisma.Decimal.max(new Prisma.Decimal(credito.montoInicial).minus(capitalPagado), 0)

  if (credito.numeroCuotas === 0) {
    const { valorPeriodico } = calcularResumenCredito({
      montoInicial: credito.montoInicial,
      tasaInteres: credito.tasaInteres,
      numeroCuotas: 0,
      frecuenciaPago: credito.frecuenciaPago,
      fechaInicio: credito.fechaInicio,
      redondearCuotaMil: credito.redondearCuotaMil,
    })
    const interesCausado = valorPeriodico.times(periodosTranscurridosDe(credito))
    return { interesPendiente: Prisma.Decimal.max(interesCausado.minus(interesesPagados), 0), capitalPendiente }
  }

  const { totalIntereses } = calcularResumenCredito({
    montoInicial: credito.montoInicial,
    tasaInteres: credito.tasaInteres,
    numeroCuotas: credito.numeroCuotas,
    frecuenciaPago: credito.frecuenciaPago,
    fechaInicio: credito.fechaInicio,
    redondearCuotaMil: credito.redondearCuotaMil,
  })
  return { interesPendiente: Prisma.Decimal.max(totalIntereses.minus(interesesPagados), 0), capitalPendiente }
}

// Cartera en mora — suma, de TODOS los créditos activos del tenant, de las
// cuotas que ya cayeron en mora y siguen sin pagar (montoVencidoSinPagarDe,
// misma función que alimenta "Mora acumulada" en el detalle de préstamo) más
// los recargos pendientes (mora + cargos manuales combinados, mismo criterio
// que estadoCuotasDe/estadoPeriodoSoloInteresesDe — "recargos" ya no separa
// mora de gastos de cobranza, spec 2026-07-23). Decisión del usuario
// 2026-07-22 — reemplaza el criterio anterior (montoInicial completo de
// créditos EN_MORA/VENCIDO), que inflaba el número con el saldo de capital
// todavía no vencido. Fuente única: la usan estadisticasCreditos
// (Prestamos.jsx) y el dashboard del tenant (dashboard.service.js) — para no
// divergir en silencio.
async function carteraEnMoraDe(tenantId) {
  const creditos = await prisma.credito.findMany({
    where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
    select: {
      id: true, montoInicial: true, tasaInteres: true, numeroCuotas: true,
      frecuenciaPago: true, fechaInicio: true, redondearCuotaMil: true, plantillaId: true,
    },
  })
  if (creditos.length === 0) return 0

  const abonoPorCredito = await abonosPorCreditoDe(tenantId, creditos.map(c => c.id))

  let total = new Prisma.Decimal(0)
  for (const credito of creditos) {
    total = total.plus(montoVencidoSinPagarDe(credito, abonoPorCredito.get(credito.id)))

    const recargosPendientes = credito.numeroCuotas === 0
      ? (await estadoPeriodoSoloInteresesDe(tenantId, credito)).recargosPendientes
      : (await estadoCuotasDe(tenantId, credito)).reduce((acc, c) => acc.plus(c.recargosPendientes), new Prisma.Decimal(0))
    total = total.plus(recargosPendientes)
  }

  return total
}

// ── Estadísticas del dashboard de préstamos ─────────────────────────────────
async function estadisticasCreditos(req) {
  const { tenantId } = req.empleado

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesSiguiente = new Date(inicioMes)
  inicioMesSiguiente.setMonth(inicioMesSiguiente.getMonth() + 1)

  const [capital, carteraEnMora, recaudado, activos] = await Promise.all([
    prisma.credito.aggregate({
      where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
      _sum: { montoInicial: true },
    }),
    carteraEnMoraDe(tenantId),
    prisma.pago.aggregate({
      where: { tenantId, estado: 'LIQUIDADO', fechaLiquidacion: { gte: inicioMes, lt: inicioMesSiguiente } },
      _sum: { montoRecibido: true },
    }),
    prisma.credito.count({ where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } } }),
  ])

  return {
    capitalCirculando: capital._sum.montoInicial ?? 0,
    carteraEnMora,
    recaudadoEsteMes: recaudado._sum.montoRecibido ?? 0,
    prestamosActivos: activos,
  }
}

// ── Sección 1: créditos en mora, ordenados por días de mora descendente ────
async function creditosEnMora(req) {
  const { tenantId } = req.empleado
  const { cobradorId = '' } = req.query

  const creditos = await prisma.credito.findMany({
    where: {
      tenantId,
      estado: { in: ESTADOS_CREDITO_MORA },
      ...(cobradorId && { cobradorId }),
    },
    include: INCLUDE_CLIENTE_COBRADOR,
  })

  const resultado = creditos
    .map(c => ({
      id: c.id,
      cliente: c.cliente.clienteGlobal.nombreCompleto,
      clienteCedula: c.cliente.clienteGlobal.cedula,
      cobrador: c.cobrador.nombreCompleto,
      valorCuota: calcularResumenCredito(c).valorCuota,
      diasMora: diasMoraDe(c),
      estado: c.estado,
    }))
    .sort((a, b) => b.diasMora - a.diasMora)

  return { creditos: resultado }
}

// ── Sección 2: todos los préstamos, paginado con búsqueda y filtros ────────
async function listarCreditos(req) {
  const { tenantId } = req.empleado
  const { busqueda = '', estado = '', cobradorId = '', clienteId = '', fechaDesde = '', fechaHasta = '' } = req.query
  const { paginaNum, porPaginaNum } = parsearPaginacion(req.query)

  const where = {
    tenantId,
    ...(estado && { estado }),
    ...(cobradorId && { cobradorId }),
    // clienteId: usado por la pestaña "Préstamos" del perfil de cliente — nunca
    // confía en filtrar solo por esto, siempre va junto a tenantId arriba.
    ...(clienteId && { clienteId }),
    // Rango de fechas sobre fechaInicio (fecha en que se otorgó el préstamo) —
    // no hay una especificación distinta, es la interpretación más natural
    // para un listado de "todos los préstamos".
    ...((fechaDesde || fechaHasta) && {
      fechaInicio: {
        ...(fechaDesde && { gte: new Date(fechaDesde) }),
        ...(fechaHasta && { lte: new Date(`${fechaHasta}T23:59:59.999`) }),
      },
    }),
    ...(busqueda && {
      cliente: { clienteGlobal: { nombreCompleto: { contains: busqueda } } },
    }),
  }

  const [creditos, total] = await Promise.all([
    prisma.credito.findMany({
      where,
      include: INCLUDE_CLIENTE_COBRADOR,
      orderBy: { createdAt: 'desc' },
      skip: (paginaNum - 1) * porPaginaNum,
      take: porPaginaNum,
    }),
    prisma.credito.count({ where }),
  ])

  const conSaldo = await anexarSaldoCapital(creditos, tenantId)

  const ESTADOS_SIN_PROXIMA_CUOTA = ['PAGADO', 'CASTIGADO', 'REFINANCIADO']
  const resultado = conSaldo.map(c => ({
    id: c.id,
    cliente: c.cliente.clienteGlobal.nombreCompleto,
    clienteCedula: c.cliente.clienteGlobal.cedula,
    clienteTelefono: c.cliente.clienteGlobal.telefono,
    cobrador: c.cobrador.nombreCompleto,
    monto: c.montoInicial,
    saldo: c.saldo,
    estado: c.estado,
    proximaCuota: ESTADOS_SIN_PROXIMA_CUOTA.includes(c.estado) ? null : proximaFechaCuotaDe(c),
  }))

  return {
    creditos: resultado,
    total,
    pagina: paginaNum,
    porPagina: porPaginaNum,
    totalPaginas: Math.max(1, Math.ceil(total / porPaginaNum)),
  }
}

function mensajeErrorParse(err, fallback) {
  return err?.errors?.[0]?.message || fallback
}

// ── Simulación en vivo del wizard "Nuevo préstamo" ──────────────────────────
// Sin efectos secundarios (no persiste nada) — misma fórmula exacta que
// crearCredito (calcularResumenCredito), así el resumen que ve el operador
// mientras completa el formulario nunca puede divergir del crédito real que
// se termina guardando. Deliberadamente permisivo con inputs incompletos (el
// operador todavía está escribiendo) en vez de devolver 422 en cada tecla.
// Primera fecha de cobro contractual (fechaInicio + una cadencia de
// frecuenciaPago) — misma lógica de calendario que proximaFechaCuotaDe, pero
// evaluable en la simulación, antes de que el crédito exista.
function primeraFechaCuotaDesde(fechaInicio, frecuenciaPago) {
  const dias = DIAS_POR_FRECUENCIA[frecuenciaPago]
  if (!dias || !fechaInicio) return null
  const fecha = new Date(fechaInicio)
  fecha.setDate(fecha.getDate() + dias)
  return fecha
}

async function simularCredito(req) {
  const { montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil } = req.body

  const monto = Number(montoInicial)
  const tasa = Number(tasaInteres)
  const cuotas = Number(numeroCuotas)

  if (!(monto > 0) || !(tasa > 0)) {
    return { valorCuota: null, totalAPagar: null, totalIntereses: null, fechaVencimiento: null, esSoloIntereses: false, valorPeriodico: null, diasCobro: null, entraEnMoraInmediatamente: false }
  }

  const resumen = calcularResumenCredito({
    montoInicial: monto, tasaInteres: tasa, numeroCuotas: cuotas, frecuenciaPago, fechaInicio,
    redondearCuotaMil: !!redondearCuotaMil,
  })

  // Aviso preventivo: si con la fecha de inicio y frecuencia elegidas la
  // primera cuota/cobro ya venció (fecha anterior a hoy), el crédito quedaría
  // en mora desde el momento en que se cree. No depende de días de gracia —
  // ese motor todavía no está configurado para la mayoría de tenants
  // (src/lib/configMora.js) — mismo criterio "sin gracia" que ya usa
  // diasMoraDe en este archivo.
  const primeraFecha = primeraFechaCuotaDesde(fechaInicio, frecuenciaPago)
  const entraEnMoraInmediatamente = !!primeraFecha && primeraFecha.getTime() < inicioDeHoy().getTime()

  return { ...resumen, entraEnMoraInmediatamente }
}

// ── Creación del préstamo (wizard "Nuevo préstamo") ─────────────────────────
// Transacción: Credito + Garantia + DeudorSolidario (si aplica) + MovimientoCaja
// PRESTAMO_OTORGADO (reduce el disponible de la caja, igual que un "RETIRO" en
// capital.service.js). Los documentos de la garantía se suben a R2 DESPUÉS de
// la transacción (I/O externo, no se puede revertir) — mismo patrón resiliente
// que clientes.service.js: cada archivo se intenta por separado y los que
// fallen se reportan sin tumbar la creación del crédito.
async function crearCredito(req) {
  const { tenantId, id: autorId } = req.empleado
  const {
    plantillaId, clienteId, cobradorId, cajaId,
    montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, fechaLetra, redondearCuotaMil,
    garantia: garantiaJson, deudorSolidario: deudorJson,
  } = req.body

  // Límite de préstamos activos del plan del tenant — validación estricta,
  // independiente de que el frontend ya haya bloqueado el wizard (ver
  // src/lib/limitesPlan.js, misma fuente de verdad que el dashboard).
  const { alcanzado: limiteAlcanzado } = await obtenerUsoLimitePrestamos(tenantId)
  if (limiteAlcanzado) return errorLimiteAlcanzado('préstamos activos')

  let garantiaData
  try {
    garantiaData = esquemaGarantia.parse(JSON.parse(garantiaJson))
  } catch (err) {
    return { error: mensajeErrorParse(err, 'La garantía no es válida'), status: 422 }
  }

  let deudorData = null
  if (deudorJson) {
    try {
      deudorData = esquemaDeudorSolidario.parse(JSON.parse(deudorJson))
    } catch (err) {
      return { error: mensajeErrorParse(err, 'El deudor solidario no es válido'), status: 422 }
    }
  }

  const [cliente, cobrador, caja, plantilla] = await Promise.all([
    prisma.cliente.findFirst({ where: { id: clienteId, tenantId }, include: { clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true, email: true } } } }),
    prisma.empleado.findFirst({ where: { id: cobradorId, tenantId, estado: 'ACTIVO' }, include: { rol: { select: { nombre: true } } } }),
    prisma.caja.findFirst({ where: { id: cajaId, tenantId, estado: 'ACTIVA' }, include: { socio: { select: { id: true, nombreCompleto: true } } } }),
    plantillaId ? prisma.plantillaCredito.findFirst({ where: { id: plantillaId, tenantId } }) : Promise.resolve(null),
  ])
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }
  if (!cobrador || cobrador.rol?.nombre !== 'COBRADOR') return { error: 'Cobrador no encontrado o inválido', status: 404 }
  if (!caja) return { error: 'Caja de capital no encontrada o inactiva', status: 404 }
  if (plantillaId && !plantilla) return { error: 'Plantilla de crédito no encontrada', status: 404 }

  // Rango de monto de la plantilla — 0 en cualquiera de los dos = sin límite
  // (mismo criterio que Intereses.jsx).
  if (plantilla) {
    const minimo = Number(plantilla.montoMinimo)
    const maximo = Number(plantilla.montoMaximo)
    if (minimo > 0 && montoInicial < minimo) {
      return { error: `El monto debe ser mayor o igual a $${minimo.toLocaleString('es-CO')} según la plantilla seleccionada.`, status: 422 }
    }
    if (maximo > 0 && montoInicial > maximo) {
      return { error: `El monto debe ser menor o igual a $${maximo.toLocaleString('es-CO')} según la plantilla seleccionada.`, status: 422 }
    }
  }

  // Validación de saldo disponible — mismo criterio que el "QUITAR" de
  // ajustarCapital en capital.service.js (reutilizado, no reimplementado).
  const [cajaCalculada] = await anexarCalculadosCaja([caja], tenantId)
  const disponibleActual = new Prisma.Decimal(cajaCalculada.disponible)
  const montoDecimal = new Prisma.Decimal(montoInicial)
  if (montoDecimal.greaterThan(disponibleActual)) {
    return {
      error: `El monto supera el saldo disponible de la caja ($${Number(disponibleActual).toLocaleString('es-CO')}).`,
      status: 422,
    }
  }
  const nuevoDisponible = disponibleActual.minus(montoDecimal)

  const redondear = redondearCuotaMil === 'true'
  const { fechaVencimiento } = calcularResumenCredito({
    montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil: redondear,
  })

  const creditoId = uuidv7()
  const fecha = new Date()

  await prisma.$transaction(async tx => {
    await tx.credito.create({
      data: {
        id: creditoId,
        tenantId,
        clienteId,
        cobradorId,
        cajaId,
        plantillaId: plantillaId || null,
        montoInicial,
        tasaInteres,
        // numeroCuotas 0 = solo intereses: plazo 0 (indefinido), sin fecha de
        // vencimiento fija (columna nullable, ver schema).
        plazo: numeroCuotas * DIAS_POR_FRECUENCIA[frecuenciaPago],
        numeroCuotas,
        frecuenciaPago,
        fechaInicio: new Date(fechaInicio),
        fechaVencimiento,
        fechaLetra: fechaLetra ? new Date(fechaLetra) : null,
        redondearCuotaMil: redondear,
        estado: 'ACTIVO',
      },
    })

    await tx.garantia.create({
      data: {
        id: uuidv7(),
        tenantId,
        creditoId,
        tipo: garantiaData.tipo,
        descripcion: garantiaData.descripcion,
        valorEstimado: garantiaData.valorEstimado ?? null,
      },
    })

    if (deudorData) {
      await tx.deudorSolidario.create({
        data: {
          id: uuidv7(),
          tenantId,
          creditoId,
          clienteId: deudorData.clienteId || null,
          nombreCompleto: deudorData.nombreCompleto,
          cedula: deudorData.cedula,
          telefono: deudorData.telefono,
          direccion: deudorData.direccion || null,
          relacionConDeudor: deudorData.relacionConDeudor,
          firmoDocumento: deudorData.firmoDocumento,
          estado: 'ACTIVO',
        },
      })
    }

    await tx.movimientoCaja.create({
      data: {
        id: uuidv7(),
        tenantId,
        cajaId,
        tipo: 'PRESTAMO_OTORGADO',
        monto: montoInicial,
        referenciaId: creditoId,
        referenciaTipo: 'Credito',
        saldoDespuesMovimiento: nuevoDisponible,
        registradoPorId: autorId,
        fecha,
        observaciones: `Préstamo otorgado a ${cliente.clienteGlobal.nombreCompleto}`,
      },
    })
  })

  const archivos = req.files || []
  const documentos = []
  const documentosFallidos = []
  for (const archivo of archivos) {
    try {
      const documento = await subirDocumento({
        tenantId,
        entidadTipo: 'CREDITO',
        entidadId: creditoId,
        subidoPorId: autorId,
        nombreArchivo: archivo.originalname,
        archivo,
      })
      documentos.push(documento)
    } catch (err) {
      if (!(err instanceof ErrorDocumento)) throw err
      documentosFallidos.push({ nombre: archivo.originalname, error: err.message })
    }
  }

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CREAR_CREDITO',
    entidadTipo: 'Credito',
    entidadId: creditoId,
    valorNuevo: {
      clienteId, cobradorId, cajaId, plantillaId: plantillaId || null,
      montoInicial: Number(montoInicial),
      tasaInteres: Number(tasaInteres),
      numeroCuotas,
      frecuenciaPago,
      redondearCuotaMil: redondear,
    },
  })

  // PDF de "Resumen de préstamo" + email al cliente (decisión 2026-07-18): solo
  // si el cliente tiene email registrado (ClienteGlobal.email es opcional) — si
  // no lo tiene, el crédito ya se creó igual arriba, sin enviar nada. Nada de
  // acá puede tumbar la respuesta: el crédito ya es un hecho consumado en este
  // punto, cualquier error de render/envío solo se registra en consola.
  if (cliente.clienteGlobal.email) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })
      const tenantNombre = tenant?.nombreNegocio ?? 'GotaPay'

      const resumen = calcularResumenCredito({ montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil: redondear })
      const esSoloIntereses = Number(numeroCuotas) === 0
      const cronograma = calcularCronogramaCredito({ montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil: redondear })
        .map(c => ({
          numero: c.numero,
          fecha: c.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          capital: c.capital.toNumber(),
          interes: c.interes.toNumber(),
          totalCuota: c.totalCuota.toNumber(),
          saldo: c.saldo.toNumber(),
        }))

      const tokenVerificacion = generarTokenVerificacion()
      const urlDoc = urlVerificacion(tokenVerificacion)
      const qrPngBuffer = await generarQrPngBuffer(urlDoc)
      const idPrestamo = `GP-${fecha.getFullYear()}-${creditoId.replace(/-/g, '').slice(-6).toUpperCase()}`

      const pdfBuffer = await generarPdfResumenPrestamo({
        idPrestamo,
        fechaGeneracion: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
        tenantNombre,
        cliente: {
          nombreCompleto: cliente.clienteGlobal.nombreCompleto,
          cedula: cliente.clienteGlobal.cedula,
          telefono: cliente.clienteGlobal.telefono,
          email: cliente.clienteGlobal.email,
        },
        deudorSolidario: deudorData
          ? {
              nombreCompleto: deudorData.nombreCompleto,
              cedula: deudorData.cedula,
              telefono: deudorData.telefono,
              relacionConDeudor: deudorData.relacionConDeudor,
            }
          : null,
        montoInicial: Number(montoInicial),
        tasaInteres: Number(tasaInteres),
        frecuenciaPago,
        numeroCuotas,
        plazoTexto: esSoloIntereses ? null : `${numeroCuotas} ${UNIDADES_PLAZO[frecuenciaPago] || ''}`,
        valorCuota: resumen.valorCuota ? resumen.valorCuota.toNumber() : null,
        totalAPagar: esSoloIntereses ? null : resumen.totalAPagar.toNumber(),
        totalIntereses: esSoloIntereses ? null : resumen.totalIntereses.toNumber(),
        esSoloIntereses,
        valorPeriodico: resumen.valorPeriodico ? resumen.valorPeriodico.toNumber() : null,
        cronograma,
        urlVerificacion: urlDoc,
        qrPngDataUri: `data:image/png;base64,${qrPngBuffer.toString('base64')}`,
      })

      // Token solo se persiste si el PDF de verdad se generó — si algo de lo de
      // arriba lanza, no queda un token "verificable" para un documento que
      // nunca se generó ni se envió.
      await prisma.credito.update({ where: { id: creditoId }, data: { tokenVerificacion } })

      const html = emailResumenPrestamo({
        nombreCliente: cliente.clienteGlobal.nombreCompleto,
        nombreNegocio: tenantNombre,
        montoInicial: Number(montoInicial),
        tasaInteres: Number(tasaInteres),
        numeroCuotas,
        frecuenciaPago,
        valorCuota: resumen.valorCuota ? resumen.valorCuota.toNumber() : null,
        valorPeriodico: resumen.valorPeriodico ? resumen.valorPeriodico.toNumber() : null,
        esSoloIntereses,
      })

      enviarEmail({
        destinatario: cliente.clienteGlobal.email,
        asunto: `Resumen de tu préstamo — ${tenantNombre}`,
        html,
        attachments: [{ filename: `resumen-prestamo-${idPrestamo}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
      }).catch(err => console.error('[Email] Error enviando resumen de préstamo a', cliente.clienteGlobal.email, ':', err.message))

      // Copia como Documento del crédito (mismo entidadTipo que los adjuntos de
      // garantía subidos arriba) — así se puede redescargar desde el panel más
      // adelante, sin depender de que el correo haya llegado.
      subirDocumento({
        tenantId,
        entidadTipo: 'CREDITO',
        entidadId: creditoId,
        subidoPorId: autorId,
        nombreArchivo: `Resumen de préstamo ${idPrestamo}.pdf`,
        archivo: { originalname: `resumen-prestamo-${idPrestamo}.pdf`, size: pdfBuffer.length, buffer: pdfBuffer, mimetype: 'application/pdf' },
      }).catch(err => console.error('[PDF] Error guardando resumen de préstamo como documento:', err.message))
    } catch (err) {
      console.error('[PDF] Error generando resumen de préstamo para crédito', creditoId, ':', err.message)
    }
  }

  return { credito: { id: creditoId, estado: 'ACTIVO' }, documentos, documentosFallidos }
}

// Config de mora + recargos manuales agrupados por cuota — insumo compartido
// de estadoCuotasDe y estadoPeriodoSoloInteresesDe. "Recargos" ya no separa
// mora de gastos de cobranza/penalizaciones (decisión del usuario 2026-07-23:
// PARTE 1 de su spec) — ambos se cobran en el mismo paso del reparto, antes
// del interés. La mora se calcula SIEMPRE en vivo sobre el valor ORIGINAL de
// cada cuota (moraPorCuotaDe, src/lib/calculoMora.js) — nunca sobre el saldo
// actual, ni siquiera si ya se pagó.
// Devuelve, por cuota, el recargo total Y su desglose (mora automática vs.
// recargos manuales) + el % de mora vigente — el desglose lo usa el ícono de
// información junto al valor de recargos en el Plan de pagos (frontend), para
// explicar "se cobran $X por mora del Y%" en vez de mostrar solo un total.
async function resolverRecargosPorCuota(tenantId, credito, cronograma) {
  const [plantilla, recargosManuales] = await Promise.all([
    credito.plantillaId
      ? prisma.plantillaCredito.findUnique({ where: { id: credito.plantillaId } })
      : Promise.resolve(null),
    prisma.recargo.findMany({ where: { tenantId, creditoId: credito.id }, select: { valor: true, fecha: true } }),
  ])

  const config = await resolverConfigMora(tenantId, plantilla ?? { interesMoraActivo: false })
  const moraPorCuota = moraPorCuotaDe(cronograma, config)

  // Recargo no está ligado a una cuota específica (Recargo.creditoId, sin
  // número de cuota) — se agrupa por fecha en la cuota a cuyo período
  // pertenece: entre la fecha de la cuota anterior (exclusiva) y la de esta
  // cuota (inclusive); todo lo anterior a la cuota 1 cae en la cuota 1.
  const recargosOrdenados = [...recargosManuales].sort((a, b) => a.fecha - b.fecha)
  let cursor = 0
  function recargoManualHasta(fecha) {
    let suma = new Prisma.Decimal(0)
    while (cursor < recargosOrdenados.length && recargosOrdenados[cursor].fecha.getTime() <= fecha.getTime()) {
      suma = suma.plus(recargosOrdenados[cursor].valor)
      cursor++
    }
    return suma
  }

  const porCuota = cronograma.map((fila, i) => {
    const mora = moraPorCuota[i]
    const manual = recargoManualHasta(fila.fecha)
    return { total: mora.plus(manual), mora, manual }
  })

  return { porCuota, porcentajeMora: config.activo ? config.porcentaje : null }
}

// Estado de cada cuota de un crédito de plazo fijo, calculado en vivo
// (CLAUDE.md §4): cuánto queda pendiente de recargos, interés y capital, y si
// la cuota ya quedó PAGADA. Fuente única — la usan el motor de aplicación de
// pago (pagos.service.js/registrarPago), la pestaña "Plan de pagos"
// (obtenerCronogramaCredito) y "Cartera en mora" (carteraEnMoraDe).
//
// Se resuelve con 3 "pools" acumulados independientes (total histórico de
// recargos/intereses/capital ya pagado en TODO el crédito, sin distinguir a
// qué cuota) que se reparten cuota por cuota en el mismo orden. Funciona
// porque el motor de aplicación SIEMPRE llena una cuota por completo
// (recargos → interés → capital) antes de empezar la siguiente — así que el
// acumulado histórico de cada categoría por separado reconstruye exactamente
// cuánto de esa categoría ya se cubrió en cada cuota, sin necesitar guardar
// el número de cuota en DistribucionPago (ni tocar el schema).
async function estadoCuotasDe(tenantId, credito) {
  const cronograma = calcularCronogramaCredito(credito)

  const [recargosPorCuota, distribuido] = await Promise.all([
    resolverRecargosPorCuota(tenantId, credito, cronograma),
    prisma.distribucionPago.aggregate({
      // Solo LIQUIDADO: un pago PENDIENTE_LIQUIDAR no afecta el saldo del
      // crédito todavía (CLAUDE.md §7) — sus filas de DistribucionPago ya
      // existen (representan el reparto calculado), pero no cuentan acá
      // hasta que se liquide.
      where: { tenantId, creditoId: credito.id, pago: { estado: 'LIQUIDADO' } },
      // valorMora + valorRecargos: el schema los sigue guardando en columnas
      // separadas por auditoría, pero se aplican como un solo paso de
      // "recargos" — ver registrarPago en pagos.service.js.
      _sum: { valorRecargos: true, valorMora: true, valorIntereses: true, valorCapital: true },
    }),
  ])
  const { porCuota: recargosTotalesPorCuota, porcentajeMora } = recargosPorCuota

  let poolRecargos = new Prisma.Decimal(distribuido._sum.valorRecargos ?? 0).plus(distribuido._sum.valorMora ?? 0)
  let poolIntereses = new Prisma.Decimal(distribuido._sum.valorIntereses ?? 0)
  let poolCapital = new Prisma.Decimal(distribuido._sum.valorCapital ?? 0)

  return cronograma.map((fila, i) => {
    const recargosCuota = recargosTotalesPorCuota[i].total

    const recargosPagados = Prisma.Decimal.min(poolRecargos, recargosCuota)
    poolRecargos = poolRecargos.minus(recargosPagados)

    const interesPagado = Prisma.Decimal.min(poolIntereses, fila.interes)
    poolIntereses = poolIntereses.minus(interesPagado)

    const capitalPagado = Prisma.Decimal.min(poolCapital, fila.capital)
    poolCapital = poolCapital.minus(capitalPagado)

    const recargosPendientes = recargosCuota.minus(recargosPagados)
    const interesPendiente = fila.interes.minus(interesPagado)
    const capitalPendiente = fila.capital.minus(capitalPagado)

    return {
      numero: fila.numero,
      fecha: fila.fecha,
      capital: fila.capital,
      interes: fila.interes,
      recargos: recargosCuota,
      recargosMora: recargosTotalesPorCuota[i].mora,
      recargosManuales: recargosTotalesPorCuota[i].manual,
      porcentajeMora,
      recargosPendientes,
      interesPendiente,
      capitalPendiente,
      pagada: recargosPendientes.lte(0) && interesPendiente.lte(0) && capitalPendiente.lte(0),
    }
  })
}

// Equivalente de estadoCuotasDe para créditos de solo intereses (numeroCuotas
// = 0): no hay cronograma de cuotas fijas — el capital se paga aparte, cuando
// el cliente decida (CLAUDE.md/calculoCredito.js) — pero el cobro periódico
// de interés sí tiene su propia mora si se atrasa. Se trata el período más
// antiguo sin cubrir como "la cuota actual" a efectos del reparto
// recargos → interés; el capital queda siempre aparte, fuera de ese orden
// (solo se abona si el operador elige "abonar a capital" con el sobrante, ver
// pagos.service.js).
async function estadoPeriodoSoloInteresesDe(tenantId, credito) {
  const { valorPeriodico } = calcularResumenCredito({
    montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: 0,
    frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
  })
  const periodosTranscurridos = periodosTranscurridosDe(credito)

  const abonoPorCredito = await abonosPorCreditoDe(tenantId, [credito.id])
  const abono = abonoPorCredito.get(credito.id)
  const interesPagado = new Prisma.Decimal(abono?.valorIntereses ?? 0)
  const capitalPagado = new Prisma.Decimal(abono?.valorCapital ?? 0)

  const interesCausado = valorPeriodico.times(Math.max(periodosTranscurridos, 0))
  const interesPendiente = Prisma.Decimal.max(interesCausado.minus(interesPagado), 0)
  const capitalPendiente = Prisma.Decimal.max(new Prisma.Decimal(credito.montoInicial).minus(capitalPagado), 0)

  // Mora del período más antiguo sin cubrir — mismo criterio "sobre el
  // interés original" que estadoCuotasDe (moraPorCuotaDe), aplicado al único
  // período periódico vigente (no hay una fila de cronograma real acá).
  const plantilla = credito.plantillaId
    ? await prisma.plantillaCredito.findUnique({ where: { id: credito.plantillaId } })
    : null
  const config = await resolverConfigMora(tenantId, plantilla ?? { interesMoraActivo: false })

  let recargos = new Prisma.Decimal(0)
  if (config.activo && interesPendiente.gt(0) && periodosTranscurridos > 0) {
    const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
    const fechaUltimoPeriodoNoCubierto = new Date(credito.fechaInicio)
    fechaUltimoPeriodoNoCubierto.setDate(fechaUltimoPeriodoNoCubierto.getDate() + dias * periodosTranscurridos)
    const diasAtraso = Math.floor((Date.now() - fechaUltimoPeriodoNoCubierto.getTime()) / 86_400_000)
    const diasEnMora = Math.max(0, diasAtraso - config.diasGracia)
    if (diasEnMora > 0) {
      const base = config.base === 'CAPITAL' ? new Prisma.Decimal(credito.montoInicial) : valorPeriodico
      recargos = base.times(config.porcentaje).dividedBy(100).times(diasEnMora)
    }
  }

  const [recargosManuales, recargosDistribuidos] = await Promise.all([
    prisma.recargo.aggregate({ where: { tenantId, creditoId: credito.id }, _sum: { valor: true } }),
    // Solo LIQUIDADO — mismo criterio que estadoCuotasDe (CLAUDE.md §7).
    prisma.distribucionPago.aggregate({
      where: { tenantId, creditoId: credito.id, pago: { estado: 'LIQUIDADO' } },
      _sum: { valorRecargos: true, valorMora: true },
    }),
  ])
  // "Recargos" es una sola bolsa (mora + manuales combinados, spec 2026-07-23)
  // — se compara el total causado hasta hoy contra el total ya pagado de esa
  // misma bolsa combinada, nunca por separado.
  const recargosCausados = recargos.plus(recargosManuales._sum.valor ?? 0)
  const recargosPagados = new Prisma.Decimal(recargosDistribuidos._sum.valorRecargos ?? 0)
    .plus(recargosDistribuidos._sum.valorMora ?? 0)

  return {
    recargosPendientes: Prisma.Decimal.max(recargosCausados.minus(recargosPagados), 0),
    interesPendiente,
    capitalPendiente,
  }
}

// Cuotas ya vencidas (fecha <= hoy) y todavía no cubiertas por lo pagado —
// capital + interés de esas cuotas tal cual, SIN aplicar ningún porcentaje de
// plantilla (decisión del usuario 2026-07-23: la tarjeta "Mora acumulada" del
// detalle de préstamo muestra el total de cuotas vencidas sin pagar, no la
// penalización calculada — esa penalización (recargos) se calcula aparte y en
// vivo con moraPorCuotaDe, y se usa únicamente para el orden de aplicación
// del pago en pagos.service.js, no para esta tarjeta). Como el motor de pago
// siempre aplica de más viejo a más nuevo, lo pagado siempre cubre primero
// las cuotas vencidas — por eso alcanza con restar el total pagado al total
// vencido, sin tener que repartirlo cuota por cuota.
function montoVencidoSinPagarDe(credito, abono) {
  if (credito.numeroCuotas === 0) {
    return pendientesInteresCapitalDe(credito, abono).interesPendiente
  }

  const cronograma = calcularCronogramaCredito({
    montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: credito.numeroCuotas,
    frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
  })
  const montoPagado = new Prisma.Decimal(abono?.valorCapital ?? 0).plus(abono?.valorIntereses ?? 0)
  const hoyMs = inicioDeHoy().getTime()
  // Estrictamente antes de hoy: la cuota que se cobra HOY mismo todavía no
  // cuenta como vencida (decisión del usuario 2026-07-23).
  const totalVencido = cronograma
    .filter(fila => fila.fecha.getTime() < hoyMs)
    .reduce((acc, fila) => acc.plus(fila.totalCuota), new Prisma.Decimal(0))

  return Prisma.Decimal.max(totalVencido.minus(montoPagado), 0)
}

const SELECT_CREDITO_DETALLE = {
  id: true, montoInicial: true, tasaInteres: true, numeroCuotas: true, frecuenciaPago: true,
  fechaInicio: true, fechaVencimiento: true, redondearCuotaMil: true, estado: true, createdAt: true,
  plantillaId: true,
  cliente: { select: { id: true, clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true } } } },
  cobrador: { select: { id: true, nombreCompleto: true } },
  garantias: { select: { id: true, tipo: true, descripcion: true, valorEstimado: true } },
  deudoresSolidarios: { select: { id: true, nombreCompleto: true, cedula: true, telefono: true, relacionConDeudor: true, firmoDocumento: true } },
}

// "Préstamo GP-2026-XXXXXX" — mismo formato ya usado para el PDF de resumen
// (crearCredito, arriba) e idéntico criterio: derivado del id y la fecha de
// creación, nunca persistido (no es un campo real, CLAUDE.md §4).
function codigoPrestamoDe(credito) {
  return `GP-${credito.createdAt.getFullYear()}-${credito.id.replace(/-/g, '').slice(-6).toUpperCase()}`
}

// GET /creditos/:id — header + stats del detalle de préstamo: monto, saldo,
// pagado hasta hoy, mora acumulada, próxima cuota, progreso (cuotas pagadas
// de un vistazo), garantías y deudor solidario.
async function obtenerDetalleCredito(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const credito = await prisma.credito.findFirst({ where: { id, tenantId }, select: SELECT_CREDITO_DETALLE })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const abonoPorCredito = await abonosPorCreditoDe(tenantId, [id])
  const abono = abonoPorCredito.get(id)
  const pagadoHastaHoy = new Prisma.Decimal(abono?.valorCapital ?? 0).plus(abono?.valorIntereses ?? 0)
  const { interesPendiente, capitalPendiente } = pendientesInteresCapitalDe(credito, abono)
  const saldoPendiente = interesPendiente.plus(capitalPendiente)

  // Cuotas ya cubiertas: cuenta cuántas filas del cronograma quedan totalmente
  // pagadas con lo abonado hasta hoy, andando de la más vieja a la más nueva
  // (mismo criterio "de más viejo a más nuevo" del motor de aplicación de
  // pago — src/lib/aplicacionPago.js). Se detiene en la primera no cubierta.
  let cuotasPagadas = 0
  if (credito.numeroCuotas > 0) {
    const cronograma = calcularCronogramaCredito({
      montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: credito.numeroCuotas,
      frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
    })
    let acumulado = new Prisma.Decimal(0)
    for (const fila of cronograma) {
      acumulado = acumulado.plus(fila.totalCuota)
      if (!pagadoHastaHoy.gte(acumulado)) break
      cuotasPagadas++
    }
  }

  // Mora acumulada = cuotas vencidas sin pagar + recargos pendientes del
  // crédito (mismo criterio que carteraEnMoraDe, a nivel de un solo
  // crédito) — decisión del usuario 2026-07-23: no es solo el total vencido,
  // también suma los recargos (mora en pesos + manuales) que sigan
  // pendientes.
  const recargosPendientesCredito = credito.numeroCuotas === 0
    ? (await estadoPeriodoSoloInteresesDe(tenantId, credito)).recargosPendientes
    : (await estadoCuotasDe(tenantId, credito)).reduce((acc, c) => acc.plus(c.recargosPendientes), new Prisma.Decimal(0))
  const moraAcumulada = montoVencidoSinPagarDe(credito, abono).plus(recargosPendientesCredito)

  return {
    id: credito.id,
    codigo: codigoPrestamoDe(credito),
    cliente: {
      id: credito.cliente.id,
      nombreCompleto: credito.cliente.clienteGlobal.nombreCompleto,
      cedula: credito.cliente.clienteGlobal.cedula,
      telefono: credito.cliente.clienteGlobal.telefono,
    },
    cobrador: credito.cobrador,
    estado: credito.estado,
    diasMora: diasMoraDe(credito),
    montoInicial: credito.montoInicial,
    saldoPendiente,
    pagadoHastaHoy,
    moraAcumulada,
    proximaCuota: ['PAGADO', 'CASTIGADO', 'REFINANCIADO'].includes(credito.estado) ? null : proximaFechaCuotaDe(credito),
    valorProximaCuota: credito.numeroCuotas === 0
      ? calcularResumenCredito({
          montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: 0,
          frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
        }).valorPeriodico
      : calcularResumenCredito({
          montoInicial: credito.montoInicial, tasaInteres: credito.tasaInteres, numeroCuotas: credito.numeroCuotas,
          frecuenciaPago: credito.frecuenciaPago, fechaInicio: credito.fechaInicio, redondearCuotaMil: credito.redondearCuotaMil,
        }).valorCuota,
    numeroCuotas: credito.numeroCuotas,
    cuotasPagadas,
    esSoloIntereses: credito.numeroCuotas === 0,
    fechaInicio: credito.fechaInicio,
    fechaVencimiento: credito.fechaVencimiento,
    garantias: credito.garantias,
    deudoresSolidarios: credito.deudoresSolidarios,
  }
}

// GET /creditos/:id/cronograma — pestaña "Plan de pagos": el cronograma
// contractual (calcularCronogramaCredito, fuente única) cruzado con lo
// realmente liquidado, para marcar cada cuota Pagado/En mora/Pendiente.
// `accionable` marca la ÚNICA fila donde el frontend debe habilitar
// "Registrar pago" (la primera cuota no cubierta) — es solo la señal para el
// botón: el backend de pagos nunca recibe "para qué cuota es" un pago (ver
// pagos.service.js), así que saltarse una cuota no saldada es estructuralmente
// imposible sin importar lo que haga el frontend acá.
async function obtenerCronogramaCredito(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const credito = await prisma.credito.findFirst({
    where: { id, tenantId },
    select: {
      id: true, montoInicial: true, tasaInteres: true, numeroCuotas: true,
      frecuenciaPago: true, fechaInicio: true, redondearCuotaMil: true, plantillaId: true,
    },
  })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }
  if (credito.numeroCuotas === 0) return { cuotas: [], esSoloIntereses: true }

  const estadoCuotas = await estadoCuotasDe(tenantId, credito)

  // Para el botón "Imprimir voucher" de una cuota ya pagada: qué pago
  // imprimir. Una cuota puede haberse terminado de pagar con un abono que
  // también tocó otras cuotas — se muestra el comprobante del pago MÁS
  // RECIENTE que la tocó (el que la dejó saldada), no un historial combinado.
  const distribucionesPorCuota = await prisma.distribucionPago.findMany({
    where: { tenantId, creditoId: id, numeroCuota: { not: null }, pago: { estado: 'LIQUIDADO' } },
    select: { numeroCuota: true, pagoId: true, pago: { select: { fechaRegistro: true } } },
    orderBy: { pago: { fechaRegistro: 'asc' } },
  })
  const pagoIdPorCuota = new Map()
  for (const d of distribucionesPorCuota) pagoIdPorCuota.set(d.numeroCuota, d.pagoId)

  const hoyMs = inicioDeHoy().getTime()
  let yaHayPendiente = false

  // La cuota que se cobra HOY mismo se distingue de "En mora" (ya vencida,
  // ayer o antes) y de "Pendiente" (todavía falta para su fecha) — entra en
  // mora recién al día siguiente de su vencimiento (decisión del usuario
  // 2026-07-23), nunca el mismo día.
  const cuotas = estadoCuotas.map(cuota => {
    const fechaMs = cuota.fecha.getTime()
    const estado = cuota.pagada
      ? 'PAGADO'
      : fechaMs < hoyMs ? 'EN_MORA' : fechaMs === hoyMs ? 'SE_COBRA_HOY' : 'CUOTA_PENDIENTE'
    const accionable = !cuota.pagada && !yaHayPendiente
    if (!cuota.pagada) yaHayPendiente = true

    return {
      numero: cuota.numero,
      fecha: cuota.fecha,
      valorCuota: cuota.capital.plus(cuota.interes),
      capital: cuota.capital,
      interes: cuota.interes,
      recargos: cuota.recargos,
      // Desglose para el tooltip del ícono de información junto al valor de
      // recargos (frontend) — "se cobran $X por mora del Y%", distinto de los
      // recargos manuales (gastos de cobranza, penalizaciones u otros).
      recargosMora: cuota.recargosMora,
      recargosManuales: cuota.recargosManuales,
      porcentajeMora: cuota.porcentajeMora,
      // Lo que falta pagar de ESTA cuota específicamente (recargos + interés +
      // capital pendientes) — distinto de valorCuota+recargos (el total
      // contractual de la cuota): si ya se abonó una parte, acá baja. $0
      // cuando la cuota queda completamente saldada (estado PAGADO).
      totalPendiente: cuota.recargosPendientes.plus(cuota.interesPendiente).plus(cuota.capitalPendiente),
      estado,
      accionable,
    }
  })

  return { cuotas, esSoloIntereses: false }
}

// Confirma que el crédito exista y pertenezca al tenant del request — usado
// por las funciones de documentos de crédito para no repetir la misma
// validación de aislamiento (mismo patrón que buscarColaboradorDelTenant/
// buscarClienteDelTenant).
async function buscarCreditoDelTenant({ tenantId, creditoId }) {
  return prisma.credito.findFirst({ where: { id: creditoId, tenantId }, select: { id: true } })
}

// Documentos del crédito (garantías adjuntas + resumen de préstamo generado al
// otorgar) — mismo patrón de colaboradores/clientes, con entidadTipo:'CREDITO'.
async function listarDocumentosCredito(req) {
  const { tenantId } = req.empleado
  const { id: creditoId } = req.params

  const credito = await buscarCreditoDelTenant({ tenantId, creditoId })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const documentos = await prisma.documento.findMany({
    where: { tenantId, entidadTipo: 'CREDITO', entidadId: creditoId },
    select: SELECT_DOCUMENTO,
    orderBy: { createdAt: 'desc' },
  })

  return { documentos: documentos.map(serializarDocumento) }
}

async function obtenerUrlDescargaDocumentoCredito(req) {
  const { tenantId } = req.empleado
  const { id: creditoId, documentoId } = req.params
  return obtenerUrlDescargaDocumentoDe({ tenantId, entidadTipo: 'CREDITO', entidadId: creditoId, documentoId })
}

async function subirDocumentoACredito(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id: creditoId } = req.params
  const nombre = req.body.nombre
  const archivo = req.file

  const credito = await buscarCreditoDelTenant({ tenantId, creditoId })
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }
  if (!archivo) return { error: 'Selecciona un archivo', status: 400 }
  if (!nombre || !nombre.trim()) return { error: 'El documento debe tener un nombre', status: 400 }

  let documento
  try {
    documento = await subirDocumento({
      tenantId,
      entidadTipo: 'CREDITO',
      entidadId: creditoId,
      subidoPorId: autorId,
      nombreArchivo: nombre.trim(),
      archivo,
    })
  } catch (err) {
    if (!(err instanceof ErrorDocumento)) throw err
    return { error: err.message, status: 422 }
  }

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CREDITO_DOCUMENTO_SUBIDO',
    entidadTipo: 'Credito',
    entidadId: creditoId,
    valorNuevo: { documentoId: documento.id, nombreArchivo: documento.nombreArchivo },
  })

  return { documento }
}

module.exports = {
  estadisticasCreditos, creditosEnMora, listarCreditos, simularCredito, crearCredito,
  diasMoraDe, proximaFechaCuotaDe, cuotasFaltantesDe, carteraEnMoraDe,
  abonosPorCreditoDe, pendientesInteresCapitalDe,
  estadoCuotasDe, estadoPeriodoSoloInteresesDe, codigoPrestamoDe, montoVencidoSinPagarDe,
  obtenerDetalleCredito, obtenerCronogramaCredito,
  listarDocumentosCredito, obtenerUrlDescargaDocumentoCredito, subirDocumentoACredito,
}
