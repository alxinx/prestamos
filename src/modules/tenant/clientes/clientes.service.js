'use strict'

const { v7: uuidv7 } = require('uuid')
const { Prisma } = require('@prisma/client')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { subirDocumento, ErrorDocumento, extensionDe } = require('../../../lib/documentos')
const { generarUrlDescargaR2 } = require('../../../lib/r2Client')
const { normalizarTitulo } = require('../../../lib/validar')
const { esquemaUbicaciones, esquemaReferencias } = require('./clientes.validator')
const { ESTADOS_CREDITO_ACTIVOS, ESTADOS_CREDITO_MORA, DIAS_POR_FRECUENCIA } = require('../../../lib/creditosConstantes')
const { calcularResumenCredito } = require('../../../lib/calculoCredito')
const { diasMoraDe, proximaFechaCuotaDe, cuotasFaltantesDe } = require('../creditos/creditos.service')
const { parsearPaginacion } = require('../../../lib/paginacion')

// ClienteGlobal es la ÚNICA tabla de este módulo que deliberadamente NO se filtra
// por tenantId — existe justo para deduplicar personas reales entre tenants por
// cédula (misma excepción ya documentada para /api/activar y /api/verificar).
// Cliente, UbicacionCliente, ReferenciaPersonal y Consentimiento sí llevan
// tenantId siempre.
async function buscarPorCedula(tenantId, cedula) {
  const clienteGlobal = await prisma.clienteGlobal.findUnique({ where: { cedula } })
  if (!clienteGlobal) return { existeGlobal: false, existeEnTenant: false, clienteId: null, clienteGlobal: null }

  const clienteTenant = await prisma.cliente.findFirst({
    where: { tenantId, clienteGlobalId: clienteGlobal.id },
    select: { id: true },
  })

  return {
    existeGlobal: true,
    existeEnTenant: !!clienteTenant,
    clienteId: clienteTenant?.id ?? null,
    clienteGlobal,
  }
}

// GET /clientes/verificar-cedula/:cedula — primer paso del wizard: busca si la
// cédula ya existe en la base global y, de existir, si ya pertenece a este tenant.
async function verificarCedula(req) {
  const { tenantId } = req.empleado
  const cedula = String(req.params.cedula || '').trim()
  if (!cedula || cedula.length > 30) return { error: 'Cédula inválida', status: 400 }

  const { clienteGlobal, ...resto } = await buscarPorCedula(tenantId, cedula)

  return {
    ...resto,
    clienteGlobal: clienteGlobal
      ? {
          nombreCompleto: clienteGlobal.nombreCompleto,
          telefono: clienteGlobal.telefono,
          email: clienteGlobal.email,
          fechaNacimiento: clienteGlobal.fechaNacimiento,
        }
      : null,
  }
}

async function crearCliente(req) {
  const { tenantId, id: autorId } = req.empleado
  const datos = req.body
  const archivos = req.files || []

  // ubicaciones/referencias/documentosMeta viajan como JSON stringificado dentro
  // del multipart (mismo patrón que documentosMeta en colaboradores) — el
  // validator de la capa multipart solo confirmó que son strings; el shape real
  // se valida aquí con los mismos esquemas Zod, ya con los datos parseados.
  let ubicacionesCrudas
  try {
    ubicacionesCrudas = JSON.parse(datos.ubicaciones)
  } catch {
    return { error: 'Ubicaciones inválidas', status: 400 }
  }
  const resultadoUbicaciones = esquemaUbicaciones.safeParse(ubicacionesCrudas)
  if (!resultadoUbicaciones.success) return { error: resultadoUbicaciones.error.errors[0].message, status: 422 }
  const ubicaciones = resultadoUbicaciones.data

  let referencias = []
  if (datos.referencias) {
    let referenciasCrudas
    try {
      referenciasCrudas = JSON.parse(datos.referencias)
    } catch {
      return { error: 'Referencias inválidas', status: 400 }
    }
    const resultadoReferencias = esquemaReferencias.safeParse(referenciasCrudas)
    if (!resultadoReferencias.success) return { error: resultadoReferencias.error.errors[0].message, status: 422 }
    referencias = resultadoReferencias.data
  }

  let documentosMeta = []
  if (datos.documentosMeta) {
    try {
      documentosMeta = JSON.parse(datos.documentosMeta)
    } catch {
      return { error: 'Metadata de documentos inválida', status: 400 }
    }
  }
  if (!Array.isArray(documentosMeta) || documentosMeta.length !== archivos.length) {
    return { error: 'La cantidad de documentos no coincide con los archivos enviados', status: 400 }
  }
  if (documentosMeta.some(d => !d?.nombre || typeof d.nombre !== 'string' || !d.nombre.trim())) {
    return { error: 'Todos los documentos deben tener un nombre', status: 400 }
  }

  // zonaId/cobradorId: nunca se usa un uuid del frontend sin confirmar que el
  // recurso pertenece a este tenant.
  let zonaId = null
  if (datos.zonaId) {
    const zona = await prisma.zonaCobertura.findFirst({ where: { id: datos.zonaId, tenantId }, select: { id: true } })
    if (!zona) return { error: 'Zona de cobertura inválida', status: 400 }
    zonaId = zona.id
  }

  let cobradorId = null
  if (datos.cobradorId) {
    const cobrador = await prisma.empleado.findFirst({ where: { id: datos.cobradorId, tenantId }, select: { id: true } })
    if (!cobrador) return { error: 'Cobrador inválido', status: 400 }
    cobradorId = cobrador.id
  }

  let fechaNacimiento = null
  if (datos.fechaNacimiento) {
    const fecha = new Date(datos.fechaNacimiento)
    if (isNaN(fecha.getTime())) return { error: 'Fecha de nacimiento inválida', status: 422 }
    fechaNacimiento = fecha
  }

  const cedula = datos.cedula.trim()
  const { existeGlobal, existeEnTenant, clienteGlobal: clienteGlobalExistente } = await buscarPorCedula(tenantId, cedula)

  if (existeEnTenant) {
    return { error: 'Este cliente ya existe en tu organización.', status: 409 }
  }
  if (!existeGlobal && (!datos.nombreCompleto?.trim() || !datos.telefono?.trim())) {
    return { error: 'El nombre completo y el teléfono son requeridos para registrar un cliente nuevo.', status: 422 }
  }

  const { cliente, clienteGlobal } = await prisma.$transaction(async tx => {
    const global = clienteGlobalExistente ?? await tx.clienteGlobal.create({
      data: {
        id: uuidv7(),
        cedula,
        nombreCompleto: normalizarTitulo(datos.nombreCompleto.trim()),
        telefono: datos.telefono.trim(),
        email: datos.email?.trim() || null,
        fechaNacimiento,
      },
    })

    const clienteId = uuidv7()
    const creado = await tx.cliente.create({
      data: {
        id: clienteId,
        tenantId,
        clienteGlobalId: global.id,
        zonaId,
        cobradorId,
        estado: 'ACTIVO',
        observaciones: datos.observaciones?.trim() || null,
      },
    })

    await tx.ubicacionCliente.createMany({
      data: ubicaciones.map((u, i) => ({
        id: uuidv7(),
        tenantId,
        clienteId,
        tipo: u.tipo,
        direccion: u.direccion,
        barrio: u.barrio || null,
        ciudad: u.ciudad,
        referencia: u.referencia || null,
        horarioUbicacion: u.horarioUbicacion || null,
        latitud: u.latitud ?? null,
        longitud: u.longitud ?? null,
        // Nunca se confía en el frontend para marcar la principal — siempre la
        // primera del arreglo, sin excepción.
        esPrincipal: i === 0,
        activa: true,
      })),
    })

    if (referencias.length > 0) {
      await tx.referenciaPersonal.createMany({
        data: referencias.map(r => ({
          id: uuidv7(),
          tenantId,
          clienteId,
          nombreCompleto: r.nombreCompleto,
          telefono: r.telefono,
          relacionConCliente: r.relacionConCliente,
          observaciones: r.observaciones || null,
        })),
      })
    }

    const compartirScore = datos.consentimientoCompartirScore === 'true'
    const notificacionesWsp = datos.consentimientoNotificacionesWsp === 'true'
    const ahora = new Date()

    await tx.consentimiento.create({
      data: {
        id: uuidv7(),
        clienteGlobalId: global.id,
        tenantId,
        tratamientoDatos: true,
        fechaTratamientoDatos: ahora,
        compartirScore,
        fechaCompartirScore: compartirScore ? ahora : null,
        recibirNotificacionesWsp: notificacionesWsp,
        fechaNotificacionesWsp: notificacionesWsp ? ahora : null,
      },
    })

    return { cliente: creado, clienteGlobal: global }
  })

  // Documentos a R2 fuera de la transacción (I/O externo, no se puede revertir) —
  // mismo patrón resiliente que crearColaborador: cada archivo se intenta por
  // separado y los que fallen se reportan sin tumbar la creación del cliente.
  const documentos = []
  const documentosFallidos = []
  for (let i = 0; i < archivos.length; i++) {
    try {
      const documento = await subirDocumento({
        tenantId,
        entidadTipo: 'CLIENTE',
        entidadId: cliente.id,
        subidoPorId: autorId,
        nombreArchivo: documentosMeta[i].nombre.trim(),
        archivo: archivos[i],
      })
      documentos.push(documento)
    } catch (err) {
      if (!(err instanceof ErrorDocumento)) throw err
      documentosFallidos.push({ nombre: documentosMeta[i].nombre, error: err.message })
    }
  }

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CLIENTE_CREADO',
    entidadTipo: 'Cliente',
    entidadId: cliente.id,
    valorNuevo: { cedula, nombreCompleto: clienteGlobal.nombreCompleto },
  })

  return {
    cliente: {
      id: cliente.id,
      nombreCompleto: clienteGlobal.nombreCompleto,
      cedula: clienteGlobal.cedula,
      telefono: clienteGlobal.telefono,
    },
    documentos,
    documentosFallidos,
  }
}

// Owed real de un crédito activo: contractual (capital + interés) menos lo ya
// abonado a capital/intereses. Solo intereses (numeroCuotas=0) no tiene un
// "total del contrato" (CLAUDE.md/calculoCredito.js) — el capital se debe por
// completo hasta que el cliente decida pagarlo, más el interés causado por los
// períodos ya transcurridos que todavía no se haya pagado. Mora/recargos no se
// incluyen: el motor que los cobra todavía no existe (src/lib/configMora.js),
// así que hoy siempre serían 0 — no hay nada real que sumar.
function owedDeCredito(credito, abono) {
  const capitalPagado = new Prisma.Decimal(abono?.valorCapital ?? 0)
  const interesesPagados = new Prisma.Decimal(abono?.valorIntereses ?? 0)

  let owed
  if (credito.numeroCuotas === 0) {
    const { valorPeriodico } = calcularResumenCredito({
      montoInicial: credito.montoInicial,
      tasaInteres: credito.tasaInteres,
      numeroCuotas: 0,
      frecuenciaPago: credito.frecuenciaPago,
      fechaInicio: credito.fechaInicio,
      redondearCuotaMil: credito.redondearCuotaMil,
    })
    const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago] ?? null
    const periodosTranscurridos = dias
      ? Math.max(0, Math.floor((Date.now() - new Date(credito.fechaInicio).getTime()) / (dias * 86_400_000)))
      : 0
    const saldoCapital = new Prisma.Decimal(credito.montoInicial).minus(capitalPagado)
    owed = saldoCapital.plus(valorPeriodico.times(periodosTranscurridos)).minus(interesesPagados)
  } else {
    const { totalAPagar } = calcularResumenCredito({
      montoInicial: credito.montoInicial,
      tasaInteres: credito.tasaInteres,
      numeroCuotas: credito.numeroCuotas,
      frecuenciaPago: credito.frecuenciaPago,
      fechaInicio: credito.fechaInicio,
      redondearCuotaMil: credito.redondearCuotaMil,
    })
    owed = totalAPagar.minus(capitalPagado).minus(interesesPagados)
  }

  return Prisma.Decimal.max(owed, 0)
}

// El "préstamo que más urge" de un cliente con varios créditos activos: primero
// el más atrasado (EN_MORA/VENCIDO con más días de mora); si ninguno está en
// mora, el de próxima cuota más cercana (decisión del usuario, 2026-07-19).
function creditoMasUrgenteDe(creditos) {
  const enMora = creditos.filter(c => ESTADOS_CREDITO_MORA.includes(c.estado))
  if (enMora.length > 0) {
    return enMora.reduce((peor, actual) => (diasMoraDe(actual) > diasMoraDe(peor) ? actual : peor))
  }
  return creditos.reduce((antes, actual) => {
    const fechaAntes = proximaFechaCuotaDe(antes)
    const fechaActual = proximaFechaCuotaDe(actual)
    if (!fechaAntes) return actual
    if (!fechaActual) return antes
    return fechaActual < fechaAntes ? actual : antes
  })
}

// Listado paginado de clientes de este tenant. Préstamos/valores se calculan en
// tiempo real desde Credito (nunca persistidos, CLAUDE.md §4). valorAdeudado
// suma, por cliente, lo pendiente de TODOS sus créditos activos (capital +
// interés contractual - abonos, ver owedDeCredito). cuotasFaltantes es de UN
// solo crédito — el más urgente (ver creditoMasUrgenteDe) — y sale en -1
// (símbolo de infinito en frontend) si ese crédito es de solo intereses.
async function listarClientes(req) {
  const { tenantId } = req.empleado
  const { busqueda = '', estado = '' } = req.query
  const { paginaNum, porPaginaNum } = parsearPaginacion(req.query)

  const where = {
    tenantId,
    ...(estado && { estado }),
    ...(busqueda && {
      clienteGlobal: {
        OR: [
          { nombreCompleto: { contains: busqueda } },
          { cedula: { contains: busqueda } },
          { telefono: { contains: busqueda } },
        ],
      },
    }),
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true } },
        scoreInterno: { select: { scoreActual: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (paginaNum - 1) * porPaginaNum,
      take: porPaginaNum,
    }),
    prisma.cliente.count({ where }),
  ])

  const clienteIds = clientes.map(c => c.id)
  const [creditosActivos, conteosPrestamos] = clienteIds.length === 0 ? [[], []] : await Promise.all([
    prisma.credito.findMany({
      where: { tenantId, clienteId: { in: clienteIds }, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
      select: {
        id: true, clienteId: true, montoInicial: true, tasaInteres: true,
        numeroCuotas: true, frecuenciaPago: true, fechaInicio: true,
        fechaVencimiento: true, estado: true, redondearCuotaMil: true,
      },
    }),
    prisma.credito.groupBy({
      by: ['clienteId'],
      where: { tenantId, clienteId: { in: clienteIds } },
      _count: { id: true },
    }),
  ])

  const creditoIds = creditosActivos.map(c => c.id)
  const abonos = creditoIds.length === 0 ? [] : await prisma.distribucionPago.groupBy({
    by: ['creditoId'],
    where: { tenantId, creditoId: { in: creditoIds } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  const abonoPorCredito = new Map(abonos.map(a => [a.creditoId, a._sum]))

  const valorAdeudadoPorCliente = new Map()
  const valorPrestamoPorCliente = new Map()
  const creditosPorCliente = new Map()

  for (const credito of creditosActivos) {
    const owed = owedDeCredito(credito, abonoPorCredito.get(credito.id))
    valorAdeudadoPorCliente.set(credito.clienteId, (valorAdeudadoPorCliente.get(credito.clienteId) ?? new Prisma.Decimal(0)).plus(owed))
    valorPrestamoPorCliente.set(credito.clienteId, (valorPrestamoPorCliente.get(credito.clienteId) ?? new Prisma.Decimal(0)).plus(credito.montoInicial))

    if (!creditosPorCliente.has(credito.clienteId)) creditosPorCliente.set(credito.clienteId, [])
    creditosPorCliente.get(credito.clienteId).push(credito)
  }

  const cuotasFaltantesPorCliente = new Map()
  for (const [clienteId, creditos] of creditosPorCliente) {
    cuotasFaltantesPorCliente.set(clienteId, cuotasFaltantesDe(creditoMasUrgenteDe(creditos)))
  }

  const numPorCliente = new Map(conteosPrestamos.map(c => [c.clienteId, c._count.id]))

  const resultado = clientes.map(c => ({
    id: c.id,
    nombreCompleto: c.clienteGlobal.nombreCompleto,
    cedula: c.clienteGlobal.cedula,
    telefono: c.clienteGlobal.telefono,
    estado: c.estado,
    calificacion: c.scoreInterno ? Number(c.scoreInterno.scoreActual) : null,
    numPrestamos: numPorCliente.get(c.id) ?? 0,
    valorPrestamo: (valorPrestamoPorCliente.get(c.id) ?? new Prisma.Decimal(0)).toNumber(),
    valorAdeudado: (valorAdeudadoPorCliente.get(c.id) ?? new Prisma.Decimal(0)).toNumber(),
    cuotasFaltantes: cuotasFaltantesPorCliente.get(c.id) ?? 0,
  }))

  return {
    clientes: resultado,
    total,
    pagina: paginaNum,
    porPagina: porPaginaNum,
    totalPaginas: Math.max(1, Math.ceil(total / porPaginaNum)),
  }
}

// "% de clientes al día" y "en mora" usan el estado real del Cliente (no depende
// de Créditos). "Por finalizar" (1-3 cuotas pendientes) sí depende del módulo de
// Créditos/Pagos — queda en 0 hasta que exista esa lógica, no se inventa.
async function estadisticasClientes(req) {
  const { tenantId } = req.empleado

  const [total, activos, enMora] = await Promise.all([
    prisma.cliente.count({ where: { tenantId } }),
    prisma.cliente.count({ where: { tenantId, estado: 'ACTIVO' } }),
    prisma.cliente.count({ where: { tenantId, estado: 'EN_MORA' } }),
  ])

  return {
    total,
    porcentajeAlDia: total > 0 ? Number(((activos / total) * 100).toFixed(1)) : 0,
    porFinalizar: 0,
    enMora,
  }
}

// GET /clientes/:id — detalle completo de un cliente ya registrado en este
// tenant, usado por el modal "Ver datos" del wizard de préstamos (y cualquier
// otra pantalla que necesite el perfil completo). Nunca expone documentos con
// ruta directa de R2 (CLAUDE.md §9) — este endpoint no los incluye.
async function obtenerDetalleCliente(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const cliente = await prisma.cliente.findFirst({
    where: { id, tenantId },
    include: {
      clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true, email: true, fechaNacimiento: true } },
      zona: { select: { id: true, nombre: true } },
      cobrador: { select: { id: true, nombreCompleto: true } },
      scoreInterno: { select: { scoreActual: true } },
      ubicaciones: {
        where: { activa: true },
        select: { id: true, tipo: true, direccion: true, barrio: true, ciudad: true, referencia: true, esPrincipal: true },
        orderBy: { esPrincipal: 'desc' },
      },
      referencias: { select: { id: true, nombreCompleto: true, telefono: true, relacionConCliente: true } },
    },
  })
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }

  const consentimiento = await prisma.consentimiento.findFirst({
    where: { tenantId, clienteGlobalId: cliente.clienteGlobalId },
    select: { tratamientoDatos: true, compartirScore: true, recibirNotificacionesWsp: true },
    orderBy: { createdAt: 'desc' },
  })

  return {
    id: cliente.id,
    cedula: cliente.clienteGlobal.cedula,
    nombreCompleto: cliente.clienteGlobal.nombreCompleto,
    telefono: cliente.clienteGlobal.telefono,
    fechaNacimiento: cliente.clienteGlobal.fechaNacimiento,
    estado: cliente.estado,
    observaciones: cliente.observaciones,
    zona: cliente.zona,
    cobrador: cliente.cobrador,
    calificacion: cliente.scoreInterno ? Number(cliente.scoreInterno.scoreActual) : null,
    ubicaciones: cliente.ubicaciones,
    referencias: cliente.referencias,
    consentimientos: {
      tratamientoDatos: consentimiento?.tratamientoDatos ?? false,
      compartirScore: consentimiento?.compartirScore ?? false,
      notificacionesWsp: consentimiento?.recibirNotificacionesWsp ?? false,
    },
    createdAt: cliente.createdAt,
  }
}

const ETIQUETAS_TIPO_PAGO = {
  PAGO_CUOTA: 'Pago cuota',
  ABONO_PARCIAL: 'Abono parcial',
  PAGO_TOTAL: 'Pago total',
  PAGO_MULTIPLES_CREDITOS: 'Pago múltiples créditos',
  PAGO_COMPROBANTE_ADMIN: 'Comprobante admin',
}

// "Préstamo N" — ordinal cronológico (por fechaInicio) de los créditos de un
// cliente, calculado en memoria para etiquetar movimientos. No existe ningún
// código de producto real en el schema (ej. "GP-001") — inventar uno sería
// dato ficticio; este ordinal sí es 100% derivado de datos reales.
function ordinalesCreditoDeCliente(creditos) {
  const ordenados = [...creditos].sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
  return new Map(ordenados.map((c, i) => [c.id, i + 1]))
}

function serializarMovimiento(pago, ordinales) {
  return {
    id: pago.id,
    fecha: pago.fechaLiquidacion ?? pago.fechaRegistro,
    concepto: `${ETIQUETAS_TIPO_PAGO[pago.tipo] ?? pago.tipo} — Préstamo ${ordinales.get(pago.creditoId) ?? '?'}`,
    monto: pago.montoRecibido,
    estado: pago.estado,
    extemporaneo: !!pago.solicitudExtemporanea,
  }
}

const SELECT_MOVIMIENTO = {
  id: true, creditoId: true, montoRecibido: true, tipo: true, estado: true,
  fechaRegistro: true, fechaLiquidacion: true,
  solicitudExtemporanea: { select: { id: true } },
}

// GET /clientes/:id/perfil — perfil completo para la página de detalle del
// cliente: datos base (igual a obtenerDetalleCliente) + stats + últimos
// movimientos. Todo lo calculado (deuda, mora, movimientos) se filtra siempre
// por tenantId + clienteId juntos — Credito/Pago/UbicacionCliente/
// ReferenciaPersonal/ScoreInterno referencian el Cliente.id tenant-scoped,
// nunca ClienteGlobal.id, así que un cliente que exista en otro tenant nunca
// puede aparecer acá (CLAUDE.md — aislamiento de tenants).
async function obtenerPerfilCliente(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const cliente = await prisma.cliente.findFirst({
    where: { id, tenantId },
    include: {
      clienteGlobal: { select: { nombreCompleto: true, cedula: true, telefono: true, email: true, fechaNacimiento: true } },
      zona: { select: { id: true, nombre: true } },
      cobrador: { select: { id: true, nombreCompleto: true } },
      scoreInterno: true,
      ubicaciones: {
        where: { activa: true },
        select: { id: true, tipo: true, direccion: true, barrio: true, ciudad: true, referencia: true, horarioUbicacion: true, esPrincipal: true },
        orderBy: { esPrincipal: 'desc' },
      },
      referencias: { select: { id: true, nombreCompleto: true, telefono: true, relacionConCliente: true } },
    },
  })
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }

  const creditos = await prisma.credito.findMany({
    where: { tenantId, clienteId: id },
    select: {
      id: true, montoInicial: true, tasaInteres: true, numeroCuotas: true,
      frecuenciaPago: true, fechaInicio: true, fechaVencimiento: true,
      estado: true, redondearCuotaMil: true,
    },
  })
  const creditosActivos = creditos.filter(c => ESTADOS_CREDITO_ACTIVOS.includes(c.estado))
  const creditoIds = creditos.map(c => c.id)

  const abonos = creditoIds.length === 0 ? [] : await prisma.distribucionPago.groupBy({
    by: ['creditoId'],
    where: { tenantId, creditoId: { in: creditoIds } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  const abonoPorCredito = new Map(abonos.map(a => [a.creditoId, a._sum]))

  const totalEnDeuda = creditosActivos.reduce(
    (acc, c) => acc.plus(owedDeCredito(c, abonoPorCredito.get(c.id))),
    new Prisma.Decimal(0),
  )

  const [pagosRealizados, agregadoPendientes, ultimosPagos] = creditoIds.length === 0
    ? [0, { _count: { id: 0 }, _sum: { montoRecibido: null } }, []]
    : await Promise.all([
        prisma.pago.count({ where: { tenantId, clienteId: id, estado: 'LIQUIDADO' } }),
        prisma.pago.aggregate({
          where: { tenantId, clienteId: id, estado: 'PENDIENTE_LIQUIDAR' },
          _count: { id: true },
          _sum: { montoRecibido: true },
        }),
        prisma.pago.findMany({
          where: { tenantId, clienteId: id },
          select: SELECT_MOVIMIENTO,
          orderBy: { fechaRegistro: 'desc' },
          take: 5,
        }),
      ])

  const ordinales = ordinalesCreditoDeCliente(creditos)

  const consentimiento = await prisma.consentimiento.findFirst({
    where: { tenantId, clienteGlobalId: cliente.clienteGlobalId },
    select: { tratamientoDatos: true, compartirScore: true, recibirNotificacionesWsp: true },
    orderBy: { createdAt: 'desc' },
  })

  return {
    id: cliente.id,
    cedula: cliente.clienteGlobal.cedula,
    nombreCompleto: cliente.clienteGlobal.nombreCompleto,
    telefono: cliente.clienteGlobal.telefono,
    fechaNacimiento: cliente.clienteGlobal.fechaNacimiento,
    estado: cliente.estado,
    observaciones: cliente.observaciones,
    zona: cliente.zona,
    cobrador: cliente.cobrador,
    calificacion: cliente.scoreInterno ? Number(cliente.scoreInterno.scoreActual) : null,
    ubicaciones: cliente.ubicaciones,
    referencias: cliente.referencias,
    consentimientos: {
      tratamientoDatos: consentimiento?.tratamientoDatos ?? false,
      compartirScore: consentimiento?.compartirScore ?? false,
      notificacionesWsp: consentimiento?.recibirNotificacionesWsp ?? false,
    },
    createdAt: cliente.createdAt,
    stats: {
      prestamosActivos: creditosActivos.length,
      totalEnDeuda: totalEnDeuda.toNumber(),
      pagosRealizados,
      pagosPendientes: {
        cantidad: agregadoPendientes._count.id,
        monto: Number(agregadoPendientes._sum.montoRecibido ?? 0),
      },
      vecesEnMora: cliente.scoreInterno?.vecesEnMora ?? 0,
      clienteAlDia: !creditosActivos.some(c => ESTADOS_CREDITO_MORA.includes(c.estado)),
    },
    ultimosMovimientos: ultimosPagos.map(p => serializarMovimiento(p, ordinales)),
  }
}

// GET /clientes/:id/pagos — historial completo de movimientos del cliente,
// paginado (pestaña "Pagos" del perfil). Mismo criterio de tenantId+clienteId
// que el resto del módulo.
async function listarMovimientosCliente(req) {
  const { tenantId } = req.empleado
  const { id: clienteId } = req.params
  const { paginaNum, porPaginaNum } = parsearPaginacion(req.query)

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, tenantId }, select: { id: true } })
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }

  const creditos = await prisma.credito.findMany({ where: { tenantId, clienteId }, select: { id: true, fechaInicio: true } })
  const ordinales = ordinalesCreditoDeCliente(creditos)

  const [pagos, total] = await Promise.all([
    prisma.pago.findMany({
      where: { tenantId, clienteId },
      select: SELECT_MOVIMIENTO,
      orderBy: { fechaRegistro: 'desc' },
      skip: (paginaNum - 1) * porPaginaNum,
      take: porPaginaNum,
    }),
    prisma.pago.count({ where: { tenantId, clienteId } }),
  ])

  return {
    movimientos: pagos.map(p => serializarMovimiento(p, ordinales)),
    total,
    pagina: paginaNum,
    porPagina: porPaginaNum,
    totalPaginas: Math.max(1, Math.ceil(total / porPaginaNum)),
  }
}

// Documentos del cliente — mismo patrón de colaboradores.service.js
// (listarDocumentosColaborador/obtenerUrlDescargaDocumento), con
// entidadTipo:'CLIENTE'. Nunca se expone la ruta directa de R2 (CLAUDE.md §9)
// — solo URLs firmadas temporales generadas acá, siempre tras validar
// tenantId + entidadId juntos.
const SELECT_DOCUMENTO_CLIENTE = { id: true, nombreArchivo: true, tamanioBytes: true, createdAt: true, url: true }

function serializarDocumentoCliente({ url, ...resto }) {
  return { ...resto, extension: extensionDe(url) }
}

async function listarDocumentosCliente(req) {
  const { tenantId } = req.empleado
  const { id: clienteId } = req.params

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, tenantId }, select: { id: true } })
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }

  const documentos = await prisma.documento.findMany({
    where: { tenantId, entidadTipo: 'CLIENTE', entidadId: clienteId },
    select: SELECT_DOCUMENTO_CLIENTE,
    orderBy: { createdAt: 'desc' },
  })

  return { documentos: documentos.map(serializarDocumentoCliente) }
}

async function obtenerUrlDescargaDocumentoCliente(req) {
  const { tenantId } = req.empleado
  const { id: clienteId, documentoId } = req.params

  const documento = await prisma.documento.findFirst({
    where: { id: documentoId, tenantId, entidadTipo: 'CLIENTE', entidadId: clienteId },
  })
  if (!documento) return { error: 'Documento no encontrado', status: 404 }

  const url = await generarUrlDescargaR2(documento.url)
  return { url }
}

// POST /clientes/:id/documentos — mismo patrón de subirDocumentoAColaborador
// (colaboradores.service.js), con entidadTipo:'CLIENTE'.
async function subirDocumentoACliente(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id: clienteId } = req.params
  const nombre = req.body.nombre
  const archivo = req.file

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, tenantId }, select: { id: true } })
  if (!cliente) return { error: 'Cliente no encontrado', status: 404 }
  if (!archivo) return { error: 'Selecciona un archivo', status: 400 }
  if (!nombre || !nombre.trim()) return { error: 'El documento debe tener un nombre', status: 400 }

  let documento
  try {
    documento = await subirDocumento({
      tenantId,
      entidadTipo: 'CLIENTE',
      entidadId: clienteId,
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
    accion: 'CLIENTE_DOCUMENTO_SUBIDO',
    entidadTipo: 'Cliente',
    entidadId: clienteId,
    valorNuevo: { documentoId: documento.id, nombreArchivo: documento.nombreArchivo },
  })

  return { documento }
}

module.exports = {
  verificarCedula, crearCliente, listarClientes, estadisticasClientes, obtenerDetalleCliente,
  obtenerPerfilCliente, listarMovimientosCliente, listarDocumentosCliente, obtenerUrlDescargaDocumentoCliente,
  subirDocumentoACliente,
}
