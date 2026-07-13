'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { subirDocumento, ErrorDocumento } = require('../../../lib/documentos')
const { normalizarTitulo } = require('../../../lib/validar')
const { esquemaUbicaciones, esquemaReferencias } = require('./clientes.validator')

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

module.exports = { verificarCedula, crearCliente }
