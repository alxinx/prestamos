'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { subirDocumento, ErrorDocumento, extensionDe } = require('../../../lib/documentos')
const { enviarEmail } = require('../../../lib/email')
const { emailActivacionColaborador } = require('../../../emails/activacionColaborador')
const { generarTokenActivacion, calcularExpiracionActivacion } = require('../../../lib/tokenActivacion')
const { publicarCambioPermisos, publicarCuentaDesactivada } = require('../../../lib/eventosEmpleado')
const { eliminarArchivoR2, generarUrlDescargaR2 } = require('../../../lib/r2Client')

// `url` se selecciona solo para derivar la extensión del archivo real (la imagen se sube
// convertida a webp, por lo que la extensión no siempre coincide con el nombre visible) —
// nunca se envía al frontend (CLAUDE.md §9: el cliente nunca recibe la ruta directa de R2).
const SELECT_DOCUMENTO = { id: true, nombreArchivo: true, tamanioBytes: true, createdAt: true, url: true }

function serializarDocumento({ url, ...resto }) {
  return { ...resto, extension: extensionDe(url) }
}

function enviarEmailActivacionColaborador({ colaborador, nombreNegocio, rolNombre, tokenActivacion }) {
  const urlActivacion = `${process.env.APP_URL}/activar-colaborador?token=${tokenActivacion}&email=${encodeURIComponent(colaborador.email)}`
  enviarEmail({
    destinatario: colaborador.email,
    asunto: `Activa tu cuenta en GotaPay — ${nombreNegocio}`,
    html: emailActivacionColaborador({
      nombreCompleto: colaborador.nombreCompleto,
      nombreNegocio,
      rol: rolNombre,
      urlActivacion,
    }),
  }).catch(err => console.error('[Email] Error enviando activación a', colaborador.email, ':', err.message))
}

const SELECT_COLABORADOR = {
  id:             true,
  nombreCompleto: true,
  cedula:         true,
  telefono:       true,
  email:          true,
  cargo:          true,
  fechaIngreso:   true,
  esSuperAdmin:   true,
  estado:         true,
  createdAt:      true,
  rol: { select: { id: true, nombre: true } },
}

async function listarColaboradores(req) {
  const { tenantId } = req.empleado

  const colaboradores = await prisma.empleado.findMany({
    where: { tenantId },
    select: SELECT_COLABORADOR,
    orderBy: { createdAt: 'desc' },
  })

  return { colaboradores }
}

async function listarRolesDisponibles(req) {
  const { tenantId } = req.empleado

  const roles = await prisma.rol.findMany({
    where: { tenantId },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return { roles }
}

async function crearColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const datos = req.body
  const archivos = req.files || []

  const rol = await prisma.rol.findFirst({ where: { id: datos.rolId, tenantId } })
  if (!rol) return { error: 'Rol inválido', status: 400 }

  const emailExistente = await prisma.empleado.findFirst({ where: { tenantId, email: datos.email } })
  if (emailExistente) return { error: 'Ya existe un colaborador con ese correo', status: 409 }

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

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })

  const id = uuidv7()
  const tokenActivacion = generarTokenActivacion()
  const tokenActivacionExpira = calcularExpiracionActivacion()

  const colaborador = await prisma.empleado.create({
    data: {
      id,
      tenantId,
      rolId:          datos.rolId,
      nombreCompleto: datos.nombreCompleto,
      cedula:         datos.cedula,
      telefono:       datos.telefono,
      email:          datos.email,
      passwordHash:   null,
      cargo:          datos.cargo || null,
      fechaIngreso:   new Date(),
      esSuperAdmin:   false,
      estado:         'ACTIVO',
      tokenActivacion,
      tokenActivacionExpira,
    },
    select: SELECT_COLABORADOR,
  })

  const documentos = []
  const documentosFallidos = []
  for (let i = 0; i < archivos.length; i++) {
    try {
      const documento = await subirDocumento({
        tenantId,
        entidadTipo: 'EMPLEADO',
        entidadId: id,
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
    accion: 'COLABORADOR_CREADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorNuevo: { nombreCompleto: colaborador.nombreCompleto, email: colaborador.email, rol: rol.nombre },
  })

  enviarEmailActivacionColaborador({ colaborador, nombreNegocio: tenant?.nombreNegocio ?? 'GotaPay', rolNombre: rol.nombre, tokenActivacion })

  return { colaborador, documentos, documentosFallidos }
}

async function obtenerColaborador(req) {
  const { tenantId } = req.empleado
  const { id } = req.params

  const colaborador = await prisma.empleado.findFirst({ where: { id, tenantId }, select: SELECT_COLABORADOR })
  if (!colaborador) return { error: 'Colaborador no encontrado', status: 404 }

  return { colaborador }
}

async function actualizarColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const datos = req.body

  const colaboradorActual = await prisma.empleado.findFirst({ where: { id, tenantId } })
  if (!colaboradorActual) return { error: 'Colaborador no encontrado', status: 404 }

  const rol = await prisma.rol.findFirst({ where: { id: datos.rolId, tenantId } })
  if (!rol) return { error: 'Rol inválido', status: 400 }

  const emailExistente = await prisma.empleado.findFirst({
    where: { tenantId, email: datos.email, NOT: { id } },
  })
  if (emailExistente) return { error: 'Ya existe otro colaborador con ese correo', status: 409 }

  const colaborador = await prisma.empleado.update({
    where: { id },
    data: {
      rolId:          datos.rolId,
      nombreCompleto: datos.nombreCompleto,
      cedula:         datos.cedula,
      telefono:       datos.telefono,
      email:          datos.email,
      cargo:          datos.cargo || null,
    },
    select: SELECT_COLABORADOR,
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_EDITADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorAnterior: {
      nombreCompleto: colaboradorActual.nombreCompleto,
      cedula: colaboradorActual.cedula,
      telefono: colaboradorActual.telefono,
      email: colaboradorActual.email,
      cargo: colaboradorActual.cargo,
      rolId: colaboradorActual.rolId,
    },
    valorNuevo: {
      nombreCompleto: colaborador.nombreCompleto,
      cedula: colaborador.cedula,
      telefono: colaborador.telefono,
      email: colaborador.email,
      cargo: colaborador.cargo,
      rolId: datos.rolId,
    },
  })

  // El rol cambia los permisos efectivos (RolPermiso) — avisa en tiempo real igual que
  // un ajuste individual de permisos.
  if (datos.rolId !== colaboradorActual.rolId) publicarCambioPermisos(id)

  return { colaborador }
}

async function cambiarEstadoColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params

  const colaborador = await prisma.empleado.findFirst({ where: { id, tenantId } })
  if (!colaborador) return { error: 'Colaborador no encontrado', status: 404 }

  if (colaborador.esSuperAdmin) {
    return { error: 'El super admin no puede desactivarse', status: 403 }
  }

  const nuevoEstado = colaborador.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

  const actualizado = await prisma.empleado.update({
    where: { id },
    data: { estado: nuevoEstado },
    select: SELECT_COLABORADOR,
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_CAMBIO_ESTADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorAnterior: { estado: colaborador.estado },
    valorNuevo: { estado: nuevoEstado },
  })

  if (nuevoEstado === 'INACTIVO') publicarCuentaDesactivada(id)

  return { colaborador: actualizado }
}

// Confirma que el colaborador exista y pertenezca al tenant del request — usado por
// las 4 funciones de documentos para no repetir la misma validación de aislamiento.
async function buscarColaboradorDelTenant({ tenantId, empleadoId }) {
  return prisma.empleado.findFirst({ where: { id: empleadoId, tenantId }, select: { id: true } })
}

async function listarDocumentosColaborador(req) {
  const { tenantId } = req.empleado
  const { id: empleadoId } = req.params

  const colaborador = await buscarColaboradorDelTenant({ tenantId, empleadoId })
  if (!colaborador) return { error: 'Colaborador no encontrado', status: 404 }

  const documentos = await prisma.documento.findMany({
    where: { tenantId, entidadTipo: 'EMPLEADO', entidadId: empleadoId },
    select: SELECT_DOCUMENTO,
    orderBy: { createdAt: 'desc' },
  })

  return { documentos: documentos.map(serializarDocumento) }
}

async function subirDocumentoAColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id: empleadoId } = req.params
  const nombre = req.body.nombre
  const archivo = req.file

  const colaborador = await buscarColaboradorDelTenant({ tenantId, empleadoId })
  if (!colaborador) return { error: 'Colaborador no encontrado', status: 404 }
  if (!archivo) return { error: 'Selecciona un archivo', status: 400 }
  if (!nombre || !nombre.trim()) return { error: 'El documento debe tener un nombre', status: 400 }

  let documento
  try {
    documento = await subirDocumento({
      tenantId,
      entidadTipo: 'EMPLEADO',
      entidadId: empleadoId,
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
    accion: 'COLABORADOR_DOCUMENTO_SUBIDO',
    entidadTipo: 'Empleado',
    entidadId: empleadoId,
    valorNuevo: { documentoId: documento.id, nombreArchivo: documento.nombreArchivo },
  })

  return { documento }
}

async function eliminarDocumentoColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id: empleadoId, documentoId } = req.params

  const documento = await prisma.documento.findFirst({
    where: { id: documentoId, tenantId, entidadTipo: 'EMPLEADO', entidadId: empleadoId },
  })
  if (!documento) return { error: 'Documento no encontrado', status: 404 }

  await eliminarArchivoR2(documento.url)
  await prisma.documento.delete({ where: { id: documentoId } })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_DOCUMENTO_ELIMINADO',
    entidadTipo: 'Empleado',
    entidadId: empleadoId,
    valorAnterior: { documentoId: documento.id, nombreArchivo: documento.nombreArchivo },
  })

  return { ok: true }
}

async function obtenerUrlDescargaDocumento(req) {
  const { tenantId } = req.empleado
  const { id: empleadoId, documentoId } = req.params

  const documento = await prisma.documento.findFirst({
    where: { id: documentoId, tenantId, entidadTipo: 'EMPLEADO', entidadId: empleadoId },
  })
  if (!documento) return { error: 'Documento no encontrado', status: 404 }

  const url = await generarUrlDescargaR2(documento.url)
  return { url }
}

module.exports = {
  listarColaboradores,
  listarRolesDisponibles,
  crearColaborador,
  obtenerColaborador,
  actualizarColaborador,
  cambiarEstadoColaborador,
  listarDocumentosColaborador,
  subirDocumentoAColaborador,
  eliminarDocumentoColaborador,
  obtenerUrlDescargaDocumento,
}
