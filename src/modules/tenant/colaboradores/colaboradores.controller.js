'use strict'

const {
  listarColaboradores, listarRolesDisponibles, crearColaborador,
  obtenerColaborador, actualizarColaborador, cambiarEstadoColaborador,
  listarDocumentosColaborador, subirDocumentoAColaborador, eliminarDocumentoColaborador, obtenerUrlDescargaDocumento,
} = require('./colaboradores.service')
const { obtenerPermisosDetalleEmpleado, actualizarPermisosEmpleado } = require('../permisos/permisos.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar          = controlar(req => listarColaboradores(req))
const manejarListarRoles     = controlar(req => listarRolesDisponibles(req))
const manejarCrear           = controlar(req => crearColaborador(req), { crear: true })
const manejarObtener         = controlar(req => obtenerColaborador(req))
const manejarActualizar      = controlar(req => actualizarColaborador(req))
const manejarCambiarEstado   = controlar(req => cambiarEstadoColaborador(req))
const manejarPermisosDetalle = controlar(req => obtenerPermisosDetalleEmpleado(req))
const manejarPermisosGuardar = controlar(req => actualizarPermisosEmpleado(req))
const manejarListarDocumentos = controlar(req => listarDocumentosColaborador(req))
const manejarSubirDocumento   = controlar(req => subirDocumentoAColaborador(req), { crear: true })
const manejarEliminarDocumento = controlar(req => eliminarDocumentoColaborador(req))
const manejarUrlDescargaDocumento = controlar(req => obtenerUrlDescargaDocumento(req))

module.exports = {
  manejarListar,
  manejarListarRoles,
  manejarCrear,
  manejarObtener,
  manejarActualizar,
  manejarCambiarEstado,
  manejarPermisosDetalle,
  manejarPermisosGuardar,
  manejarListarDocumentos,
  manejarSubirDocumento,
  manejarEliminarDocumento,
  manejarUrlDescargaDocumento,
}
