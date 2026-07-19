'use strict'

const { v7: uuidv7 } = require('uuid')
const { Prisma } = require('@prisma/client')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { enviarEmail } = require('../../../lib/email')
const { verificarContrasenaEmpleado } = require('../../../lib/verificarContrasena')
const { generarTokenVerificacion } = require('../../../lib/tokenVerificacion')
const { urlVerificacion, generarQrSvg } = require('../../../lib/qr')
const { extraerContraparte } = require('../../../lib/contraparteMovimiento')
const { emailCapitalAsignado } = require('../../../emails/capitalAsignado')
const { emailCapitalSuspendido } = require('../../../emails/capitalSuspendido')
const { emailCapitalReactivado } = require('../../../emails/capitalReactivado')
const { emailCapitalAjustado } = require('../../../emails/capitalAjustado')
const { ESTADOS_CREDITO_ACTIVOS } = require('../../../lib/creditosConstantes')

function codigoDe(cajaId) {
  return `CAP-${cajaId.slice(0, 8).toUpperCase()}`
}

function enviarEmailCapitalAsignado(socio, nombreNegocio, { nombre, valorTotal }) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Nuevo capital asignado — ${nombreNegocio}`,
    html: emailCapitalAsignado({
      nombreCompleto: socio.nombreCompleto,
      nombreNegocio,
      nombreCapital: nombre,
      valorCapital: valorTotal,
    }),
  }).catch(err => console.error('[Email] Error enviando asignación de capital a', socio.email, ':', err.message))
}

function enviarEmailCapitalSuspendido(socio, nombreNegocio, { nombre, valorTotal, disponible, enUso, movimientos }) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Capital suspendido — ${nombreNegocio}`,
    html: emailCapitalSuspendido({
      nombreCompleto: socio.nombreCompleto,
      nombreNegocio,
      nombreCapital: nombre,
      valorTotal,
      disponible,
      enUso,
      movimientos,
    }),
  }).catch(err => console.error('[Email] Error enviando suspensión de capital a', socio.email, ':', err.message))
}

function enviarEmailCapitalReactivado(socio, nombreNegocio, { nombre, valorTotal, disponible, enUso, movimientos }) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Capital reactivado — ${nombreNegocio}`,
    html: emailCapitalReactivado({
      nombreCompleto: socio.nombreCompleto,
      nombreNegocio,
      nombreCapital: nombre,
      valorTotal,
      disponible,
      enUso,
      movimientos,
    }),
  }).catch(err => console.error('[Email] Error enviando reactivación de capital a', socio.email, ':', err.message))
}

function enviarEmailCapitalAjustado(socio, nombreNegocio, { nombre, tipo, valorAnterior, valorNuevo, monto, nombreContraparte }) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `${tipo === 'AGREGAR' ? 'Capital agregado' : 'Capital retirado'} — ${nombreNegocio}`,
    html: emailCapitalAjustado({
      nombreCompleto: socio.nombreCompleto,
      nombreNegocio,
      nombreCapital: nombre,
      tipo,
      valorAnterior,
      valorNuevo,
      monto,
      nombreContraparte,
    }),
  }).catch(err => console.error('[Email] Error enviando ajuste de capital a', socio.email, ':', err.message))
}

// Arma disponible/en-uso/nro-préstamos por caja en tres consultas agregadas (no una
// por caja) — capitalDisponible sale del último MovimientoCaja.saldoDespuesMovimiento
// (nunca se persiste en Caja), capitalEnCalle de la suma de créditos aún activos.
async function anexarCalculados(cajas, tenantId) {
  const cajaIds = cajas.map(c => c.id)
  if (cajaIds.length === 0) return []

  const [ultimosMovimientos, sumasCreditosActivos, conteosCreditos] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { tenantId, cajaId: { in: cajaIds } },
      orderBy: { fecha: 'desc' },
      distinct: ['cajaId'],
      select: { cajaId: true, saldoDespuesMovimiento: true },
    }),
    prisma.credito.groupBy({
      by: ['cajaId'],
      where: { tenantId, cajaId: { in: cajaIds }, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
      _sum: { montoInicial: true },
    }),
    prisma.credito.groupBy({
      by: ['cajaId'],
      where: { tenantId, cajaId: { in: cajaIds } },
      _count: { id: true },
    }),
  ])

  const disponiblePorCaja = new Map(ultimosMovimientos.map(m => [m.cajaId, m.saldoDespuesMovimiento]))
  const enUsoPorCaja = new Map(sumasCreditosActivos.map(s => [s.cajaId, s._sum.montoInicial ?? 0]))
  const numPrestamosPorCaja = new Map(conteosCreditos.map(c => [c.cajaId, c._count.id]))

  return cajas.map(c => ({
    id: c.id,
    codigo: codigoDe(c.id),
    nombre: c.nombre,
    valorTotal: c.capitalInicial,
    disponible: disponiblePorCaja.get(c.id) ?? c.capitalInicial,
    enUso: enUsoPorCaja.get(c.id) ?? 0,
    numPrestamos: numPrestamosPorCaja.get(c.id) ?? 0,
    estado: c.estado,
    socio: { id: c.socio.id, nombre: c.socio.nombreCompleto },
    createdAt: c.createdAt,
  }))
}

// Etiquetas legibles + signo contable de cada tipo de movimiento — usado por el
// panel de detalle de un capital para mostrar el historial de movimientos.
// SUSPENSION/REACTIVACION son "eventos" (esEvento: true): no mueven dinero (monto
// siempre 0), solo dejan constancia en el historial de que el capital cambió de
// estado — el frontend los muestra sin signo ni color de entrada/salida.
const INFO_TIPO_MOVIMIENTO = {
  APORTE:             { etiqueta: 'Aporte',             entrada: true },
  RETIRO:             { etiqueta: 'Retiro',              entrada: false },
  PRESTAMO_OTORGADO:  { etiqueta: 'Préstamo otorgado',   entrada: false },
  PAGO_RECIBIDO:      { etiqueta: 'Pago recibido',       entrada: true },
  UTILIDAD_RETIRADA:  { etiqueta: 'Utilidad retirada',   entrada: false },
  SUSPENSION:         { etiqueta: 'Capital suspendido',  esEvento: true },
  REACTIVACION:       { etiqueta: 'Capital reactivado',  esEvento: true },
}

function mapearMovimiento(m) {
  const info = INFO_TIPO_MOVIMIENTO[m.tipo]
  // Solo aporte/retiro manual (ajustarCapital) tienen la semántica de "valor
  // anterior/nuevo del capital" que necesita el voucher — los demás tipos (eventos,
  // préstamos/pagos del módulo de Créditos aún no construido) no la llevan.
  const esAjusteManual = m.tipo === 'APORTE' || m.tipo === 'RETIRO'
  const valorNuevo = m.saldoDespuesMovimiento
  const valorAnterior = esAjusteManual
    ? (info.entrada ? new Prisma.Decimal(valorNuevo).minus(m.monto) : new Prisma.Decimal(valorNuevo).plus(m.monto))
    : null

  return {
    id: m.id,
    tipo: m.tipo,
    etiquetaTipo: info?.etiqueta ?? m.tipo,
    entrada: info?.entrada ?? true,
    esEvento: info?.esEvento ?? false,
    monto: m.monto,
    saldoDespues: m.saldoDespuesMovimiento,
    fecha: m.fecha,
    observaciones: m.observaciones,
    registradoPor: m.registradoPor.nombreCompleto,
    puedeImprimirVoucher: esAjusteManual && !!m.tokenVerificacion,
    valorAnterior,
    valorNuevo: esAjusteManual ? valorNuevo : null,
    nombreContraparte: esAjusteManual ? extraerContraparte(m.observaciones) : null,
    // SVG embebible directo en la tirilla — no se manda el token crudo al frontend,
    // solo el QR ya generado a partir de él.
    qrSvg: esAjusteManual && m.tokenVerificacion ? generarQrSvg(urlVerificacion(m.tokenVerificacion)) : null,
  }
}

// Compartido entre el panel de detalle (últimos 20) y el resumen del email de
// suspensión (últimos 5) — evita repetir la consulta + mapeo en dos lugares.
async function obtenerMovimientosRecientes(tenantId, cajaId, take = 20) {
  const movimientos = await prisma.movimientoCaja.findMany({
    where: { tenantId, cajaId },
    orderBy: { fecha: 'desc' },
    take,
    include: { registradoPor: { select: { nombreCompleto: true } } },
  })
  return movimientos.map(mapearMovimiento)
}

async function obtenerCapital(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const caja = await prisma.caja.findFirst({
    where: { id, tenantId },
    include: { socio: { select: { id: true, nombreCompleto: true } } },
  })
  if (!caja) return { error: 'Capital no encontrado', status: 404 }

  const [[capital], movimientos, tenant] = await Promise.all([
    anexarCalculados([caja], tenantId),
    obtenerMovimientosRecientes(tenantId, id, 20),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])

  // tenantNombre viaja junto al detalle para poder reimprimir el voucher de
  // cualquier movimiento del historial sin una consulta aparte.
  return { capital, movimientos, tenantNombre: tenant?.nombreNegocio ?? 'GotaPay' }
}

async function listarCapital(req) {
  const { tenantId } = req.empleado
  const { busqueda = '', pagina = '1', porPagina = '10' } = req.query

  const paginaNum = Math.max(1, parseInt(pagina, 10) || 1)
  const porPaginaNum = Math.min(50, Math.max(1, parseInt(porPagina, 10) || 10))

  const where = {
    tenantId,
    ...(busqueda && { nombre: { contains: busqueda } }),
  }

  const [cajas, total] = await Promise.all([
    prisma.caja.findMany({
      where,
      include: { socio: { select: { id: true, nombreCompleto: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (paginaNum - 1) * porPaginaNum,
      take: porPaginaNum,
    }),
    prisma.caja.count({ where }),
  ])

  const capital = await anexarCalculados(cajas, tenantId)

  return { capital, total, pagina: paginaNum, porPagina: porPaginaNum, totalPaginas: Math.max(1, Math.ceil(total / porPaginaNum)) }
}

// Sin comparación "vs mes anterior" — no existe snapshot histórico todavía; mostrar
// una tendencia inventada en una pantalla de dinero real sería engañoso.
async function obtenerEstadisticasCapital(req) {
  const { tenantId } = req.empleado

  const [agregado, numCapitales] = await Promise.all([
    prisma.caja.aggregate({
      where: { tenantId, estado: 'ACTIVA' },
      _sum: { capitalInicial: true },
    }),
    prisma.caja.count({ where: { tenantId, estado: 'ACTIVA' } }),
  ])

  return { totalGlobal: agregado._sum.capitalInicial ?? 0, numCapitales }
}

async function crearCapital(req) {
  const { tenantId, id: autorId } = req.empleado
  const { nombre, valorTotal } = req.body
  let { socioId } = req.body

  const [tenant, autor] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
    prisma.empleado.findFirst({
      where: { id: autorId, tenantId },
      select: { nombreCompleto: true, cedula: true, telefono: true, email: true },
    }),
  ])

  let socio
  if (socioId) {
    socio = await prisma.socio.findFirst({ where: { id: socioId, tenantId, activo: true } })
    if (!socio) return { error: 'Socio no encontrado', status: 404 }
  } else {
    // Socio responsable opcional (decisión 2026-07-18, wizard de configuración
    // inicial): si no se indica, se usa/crea un socio vinculado al propio
    // empleado que crea el capital (Socio.empleadoId ya modela esta relación)
    // — así el capital siempre tiene un socio "dueño" sin pedirle ese dato a
    // un tenant que apenas está empezando y todavía no tiene socios.
    socio = await prisma.socio.findFirst({ where: { tenantId, empleadoId: autorId, activo: true } })
    if (!socio) {
      socio = await prisma.socio.create({
        data: {
          id: uuidv7(),
          tenantId,
          empleadoId: autorId,
          nombreCompleto: autor.nombreCompleto,
          cedula: autor.cedula,
          telefono: autor.telefono,
          email: autor.email,
        },
      })
    }
    socioId = socio.id
  }

  const id = uuidv7()
  const tokenVerificacion = generarTokenVerificacion()
  const fecha = new Date()

  const caja = await prisma.$transaction(async tx => {
    const creada = await tx.caja.create({
      data: {
        id,
        tenantId,
        socioId,
        nombre,
        capitalInicial: valorTotal,
        estado: 'ACTIVA',
      },
      include: { socio: { select: { id: true, nombreCompleto: true } } },
    })

    // Movimiento de apertura — deja el saldo inicial en el libro de movimientos desde
    // el día 1, para que "disponible" siempre salga de MovimientoCaja (sin caso especial
    // para cajas recién creadas sin movimientos todavía).
    await tx.movimientoCaja.create({
      data: {
        id: uuidv7(),
        tenantId,
        cajaId: id,
        tipo: 'APORTE',
        monto: valorTotal,
        saldoDespuesMovimiento: valorTotal,
        registradoPorId: autorId,
        fecha,
        observaciones: 'Apertura de capital',
        tokenVerificacion,
      },
    })

    return creada
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CAPITAL_CREADO',
    entidadTipo: 'Caja',
    entidadId: id,
    valorNuevo: { nombre: caja.nombre, capitalInicial: valorTotal, socioId },
  })

  enviarEmailCapitalAsignado(socio, tenant?.nombreNegocio ?? 'GotaPay', { nombre, valorTotal })

  const [capital] = await anexarCalculados([caja], tenantId)

  return {
    capital,
    comprobante: {
      tenantNombre: tenant?.nombreNegocio ?? 'GotaPay',
      fecha: fecha.toISOString(),
      tipo: 'AGREGAR',
      nombreCapital: capital.nombre,
      codigoCapital: capital.codigo,
      valorAnterior: 0,
      valorNuevo: valorTotal,
      monto: valorTotal,
      nombreAutor: autor?.nombreCompleto ?? '—',
      // "Apertura de capital" no tiene contraparte — igual que al reimprimir este
      // mismo movimiento después desde el historial (ver mapearMovimiento).
      nombreContraparte: null,
      qrSvg: generarQrSvg(urlVerificacion(tokenVerificacion)),
    },
  }
}

// Cambia el estado de un capital (ACTIVA <-> INACTIVA) dejando constancia en el
// historial de movimientos (evento sin monto, arrastra el mismo saldo disponible
// de antes — no es un movimiento de dinero). Compartido por suspenderCapital y
// reactivarCapital, que solo difieren en tipo de movimiento, estado destino,
// acción de auditoría y el email que disparan.
async function cambiarEstadoCapitalConEvento({ tenantId, autorId, caja, estadoNuevo, tipoMovimiento, observaciones }) {
  const [preCalculado] = await anexarCalculados([caja], tenantId)

  const actualizada = await prisma.$transaction(async tx => {
    const act = await tx.caja.update({
      where: { id: caja.id },
      data: { estado: estadoNuevo },
      include: { socio: { select: { id: true, nombreCompleto: true } } },
    })
    await tx.movimientoCaja.create({
      data: {
        id: uuidv7(),
        tenantId,
        cajaId: caja.id,
        tipo: tipoMovimiento,
        monto: 0,
        saldoDespuesMovimiento: preCalculado.disponible,
        registradoPorId: autorId,
        fecha: new Date(),
        observaciones,
      },
    })
    return act
  })

  const [capital, movimientosRecientes] = await Promise.all([
    anexarCalculados([actualizada], tenantId).then(([c]) => c),
    obtenerMovimientosRecientes(tenantId, caja.id, 5),
  ])

  return { capital, movimientosRecientes }
}

// Suspende un capital: deja de estar disponible para asignarse a nuevos préstamos,
// pero no afecta los créditos ya otorgados con él (siguen cobrándose con normalidad).
// Requiere reconfirmar la contraseña del empleado como capa extra antes de una
// acción destructiva sobre dinero real — el permiso `capital.eliminar` ya se valida
// en la ruta, esto es una segunda barrera, no un reemplazo.
async function suspenderCapital(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const { password } = req.body

  const caja = await prisma.caja.findFirst({
    where: { id, tenantId },
    include: { socio: { select: { id: true, nombreCompleto: true, email: true } } },
  })
  if (!caja) return { error: 'Capital no encontrado', status: 404 }
  if (caja.estado === 'INACTIVA') return { error: 'Este capital ya está suspendido', status: 422 }

  const passwordValida = await verificarContrasenaEmpleado({ empleadoId: autorId, password })
  if (!passwordValida) return { error: 'Contraseña incorrecta', status: 401 }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })

  const { capital, movimientosRecientes } = await cambiarEstadoCapitalConEvento({
    tenantId,
    autorId,
    caja,
    estadoNuevo: 'INACTIVA',
    tipoMovimiento: 'SUSPENSION',
    observaciones: 'Capital suspendido',
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CAPITAL_SUSPENDIDO',
    entidadTipo: 'Caja',
    entidadId: id,
    valorAnterior: { estado: 'ACTIVA' },
    valorNuevo: { estado: 'INACTIVA' },
  })

  enviarEmailCapitalSuspendido(caja.socio, tenant?.nombreNegocio ?? 'GotaPay', {
    nombre: capital.nombre,
    valorTotal: capital.valorTotal,
    disponible: capital.disponible,
    enUso: capital.enUso,
    movimientos: movimientosRecientes,
  })

  return { capital }
}

// Reactiva un capital previamente suspendido — vuelve a estar disponible para
// asignarse a nuevos préstamos. No requiere reconfirmar contraseña (a diferencia
// de suspender): es una acción reversible y menos destructiva, y ya exige el
// permiso `capital.crear` en la ruta.
async function reactivarCapital(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params

  const caja = await prisma.caja.findFirst({
    where: { id, tenantId },
    include: { socio: { select: { id: true, nombreCompleto: true, email: true } } },
  })
  if (!caja) return { error: 'Capital no encontrado', status: 404 }
  if (caja.estado === 'ACTIVA') return { error: 'Este capital ya está activo', status: 422 }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })

  const { capital, movimientosRecientes } = await cambiarEstadoCapitalConEvento({
    tenantId,
    autorId,
    caja,
    estadoNuevo: 'ACTIVA',
    tipoMovimiento: 'REACTIVACION',
    observaciones: 'Capital reactivado',
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CAPITAL_REACTIVADO',
    entidadTipo: 'Caja',
    entidadId: id,
    valorAnterior: { estado: 'INACTIVA' },
    valorNuevo: { estado: 'ACTIVA' },
  })

  enviarEmailCapitalReactivado(caja.socio, tenant?.nombreNegocio ?? 'GotaPay', {
    nombre: capital.nombre,
    valorTotal: capital.valorTotal,
    disponible: capital.disponible,
    enUso: capital.enUso,
    movimientos: movimientosRecientes,
  })

  return { capital }
}

// Agrega o quita capital de una caja (aporte/retiro manual — ej. el socio inyecta
// más dinero, o retira parte de lo que ya no está prestado). No puede ejecutarse
// sobre un capital suspendido (primero hay que reactivarlo). Un retiro nunca puede
// superar lo disponible: no se puede sacar dinero que ya está comprometido en
// préstamos activos (ej. capital=100, prestado=20 -> máximo a retirar = 80).
// La aritmética usa Prisma.Decimal en vez de + / - nativos de JS (CLAUDE.md: nunca
// punto flotante para dinero).
async function ajustarCapital(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const { tipo, monto, nombreContraparte } = req.body

  const [caja, autor] = await Promise.all([
    prisma.caja.findFirst({
      where: { id, tenantId },
      include: { socio: { select: { id: true, nombreCompleto: true, email: true } } },
    }),
    prisma.empleado.findFirst({ where: { id: autorId, tenantId }, select: { nombreCompleto: true } }),
  ])
  if (!caja) return { error: 'Capital no encontrado', status: 404 }
  if (caja.estado !== 'ACTIVA') return { error: 'No se puede ajustar un capital suspendido. Actívalo primero.', status: 422 }

  const [preCalculado] = await anexarCalculados([caja], tenantId)
  const montoDecimal = new Prisma.Decimal(monto)
  const disponibleActual = new Prisma.Decimal(preCalculado.disponible)

  if (tipo === 'QUITAR' && montoDecimal.greaterThan(disponibleActual)) {
    return {
      error: `No puedes retirar más del capital disponible ($${Number(disponibleActual).toLocaleString('es-CO')}). Ese monto ya está comprometido en préstamos activos.`,
      status: 422,
    }
  }

  const valorAnterior = new Prisma.Decimal(preCalculado.valorTotal)
  const valorNuevo = tipo === 'AGREGAR' ? valorAnterior.plus(montoDecimal) : valorAnterior.minus(montoDecimal)
  const nuevoDisponible = tipo === 'AGREGAR' ? disponibleActual.plus(montoDecimal) : disponibleActual.minus(montoDecimal)
  const tipoMovimiento = tipo === 'AGREGAR' ? 'APORTE' : 'RETIRO'
  const observaciones = tipo === 'AGREGAR'
    ? `Aporte recibido de: ${nombreContraparte}`
    : `Retiro entregado a: ${nombreContraparte}`

  const tokenVerificacion = generarTokenVerificacion()

  const actualizada = await prisma.$transaction(async tx => {
    const act = await tx.caja.update({
      where: { id },
      data: { capitalInicial: tipo === 'AGREGAR' ? { increment: monto } : { decrement: monto } },
      include: { socio: { select: { id: true, nombreCompleto: true } } },
    })
    await tx.movimientoCaja.create({
      data: {
        id: uuidv7(),
        tenantId,
        cajaId: id,
        tipo: tipoMovimiento,
        monto,
        saldoDespuesMovimiento: nuevoDisponible,
        registradoPorId: autorId,
        fecha: new Date(),
        observaciones,
        tokenVerificacion,
      },
    })
    return act
  })

  const [capital] = await anexarCalculados([actualizada], tenantId)

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CAPITAL_AJUSTADO',
    entidadTipo: 'Caja',
    entidadId: id,
    valorAnterior: { valorTotal: valorAnterior.toNumber() },
    valorNuevo: { valorTotal: valorNuevo.toNumber(), tipo, monto, nombreContraparte },
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })
  const fecha = new Date()
  const nombreAutor = autor?.nombreCompleto ?? '—'

  enviarEmailCapitalAjustado(caja.socio, tenant?.nombreNegocio ?? 'GotaPay', {
    nombre: capital.nombre,
    tipo,
    valorAnterior: valorAnterior.toNumber(),
    valorNuevo: valorNuevo.toNumber(),
    monto,
    nombreContraparte,
  })

  return {
    capital,
    comprobante: {
      tenantNombre: tenant?.nombreNegocio ?? 'GotaPay',
      fecha: fecha.toISOString(),
      tipo,
      nombreCapital: capital.nombre,
      codigoCapital: capital.codigo,
      valorAnterior: valorAnterior.toNumber(),
      valorNuevo: valorNuevo.toNumber(),
      monto,
      nombreAutor,
      nombreContraparte,
      // SVG embebible directo en la tirilla — el token nunca viaja al frontend en
      // crudo, solo el QR ya generado a partir de él.
      qrSvg: generarQrSvg(urlVerificacion(tokenVerificacion)),
    },
  }
}

module.exports = { listarCapital, obtenerCapital, obtenerEstadisticasCapital, crearCapital, suspenderCapital, reactivarCapital, ajustarCapital, anexarCalculados }
