'use strict'

const { v7: uuidv7 } = require('uuid')
const { Prisma } = require('@prisma/client')
const prisma = require('../../../lib/prisma')
const { ESTADOS_CREDITO_ACTIVOS, ESTADOS_CREDITO_MORA, DIAS_POR_FRECUENCIA } = require('../../../lib/creditosConstantes')
const { calcularResumenCredito } = require('../../../lib/calculoCredito')
const { parsearPaginacion } = require('../../../lib/paginacion')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { subirDocumento, ErrorDocumento } = require('../../../lib/documentos')
const { anexarCalculados: anexarCalculadosCaja } = require('../capital/capital.service')
const { esquemaGarantia, esquemaDeudorSolidario } = require('./creditos.validator')

const INCLUDE_CLIENTE_COBRADOR = {
  cliente: { include: { clienteGlobal: { select: { nombreCompleto: true } } } },
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
  const dias = Math.floor((Date.now() - new Date(credito.fechaVencimiento).getTime()) / 86_400_000)
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
  const hoy = Date.now()

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

// Saldo de capital pendiente (montoInicial - abonos a capital ya liquidados),
// excluyendo intereses/mora/recargos.
async function anexarSaldoCapital(creditos, tenantId) {
  const ids = creditos.map(c => c.id)
  if (ids.length === 0) return []

  const abonos = await prisma.distribucionPago.groupBy({
    by: ['creditoId'],
    where: { tenantId, creditoId: { in: ids } },
    _sum: { valorCapital: true },
  })
  const abonoPorCredito = new Map(abonos.map(a => [a.creditoId, a._sum.valorCapital ?? 0]))

  return creditos.map(c => ({
    ...c,
    // Aritmética con Prisma.Decimal, nunca +/- nativos de JS (CLAUDE.md §4).
    saldo: new Prisma.Decimal(c.montoInicial).minus(abonoPorCredito.get(c.id) ?? 0),
  }))
}

// ── Estadísticas del dashboard de préstamos ─────────────────────────────────
// Capital circulando / Cartera en mora usan el mismo criterio "bruto" que
// capitalEnCalle en capital.service.js: suma de montoInicial de los créditos
// vigentes, sin descontar abonos — consistente con esa definición ya
// establecida (y con el ejemplo dado por el usuario: 2026-07-16).
async function estadisticasCreditos(req) {
  const { tenantId } = req.empleado

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesSiguiente = new Date(inicioMes)
  inicioMesSiguiente.setMonth(inicioMesSiguiente.getMonth() + 1)

  const [capital, mora, recaudado, activos] = await Promise.all([
    prisma.credito.aggregate({
      where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
      _sum: { montoInicial: true },
    }),
    prisma.credito.aggregate({
      where: { tenantId, estado: { in: ESTADOS_CREDITO_MORA } },
      _sum: { montoInicial: true },
    }),
    prisma.pago.aggregate({
      where: { tenantId, estado: 'LIQUIDADO', fechaLiquidacion: { gte: inicioMes, lt: inicioMesSiguiente } },
      _sum: { montoRecibido: true },
    }),
    prisma.credito.count({ where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } } }),
  ])

  return {
    capitalCirculando: capital._sum.montoInicial ?? 0,
    carteraEnMora: mora._sum.montoInicial ?? 0,
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
  const { busqueda = '', estado = '', cobradorId = '', fechaDesde = '', fechaHasta = '' } = req.query
  const { paginaNum, porPaginaNum } = parsearPaginacion(req.query)

  const where = {
    tenantId,
    ...(estado && { estado }),
    ...(cobradorId && { cobradorId }),
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
async function simularCredito(req) {
  const { montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil } = req.body

  const monto = Number(montoInicial)
  const tasa = Number(tasaInteres)
  const cuotas = Number(numeroCuotas)

  if (!(monto > 0) || !(tasa > 0)) {
    return { valorCuota: null, totalAPagar: null, totalIntereses: null, fechaVencimiento: null, esSoloIntereses: false, valorPeriodico: null, diasCobro: null }
  }

  return calcularResumenCredito({
    montoInicial: monto, tasaInteres: tasa, numeroCuotas: cuotas, frecuenciaPago, fechaInicio,
    redondearCuotaMil: !!redondearCuotaMil,
  })
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
    prisma.cliente.findFirst({ where: { id: clienteId, tenantId }, include: { clienteGlobal: { select: { nombreCompleto: true } } } }),
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

  return { credito: { id: creditoId, estado: 'ACTIVO' }, documentos, documentosFallidos }
}

module.exports = { estadisticasCreditos, creditosEnMora, listarCreditos, simularCredito, crearCredito }
