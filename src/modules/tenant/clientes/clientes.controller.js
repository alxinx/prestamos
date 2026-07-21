'use strict'

const {
  verificarCedula, crearCliente, listarClientes, estadisticasClientes, obtenerDetalleCliente,
  obtenerPerfilCliente, listarMovimientosCliente, listarDocumentosCliente, obtenerUrlDescargaDocumentoCliente,
  subirDocumentoACliente,
} = require('./clientes.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar         = controlar(req => listarClientes(req))
const manejarEstadisticas   = controlar(req => estadisticasClientes(req))
const manejarVerificarCedula = controlar(req => verificarCedula(req))
const manejarCrear           = controlar(req => crearCliente(req), { crear: true })
const manejarObtenerDetalle  = controlar(req => obtenerDetalleCliente(req))
const manejarPerfil          = controlar(req => obtenerPerfilCliente(req))
const manejarListarMovimientos = controlar(req => listarMovimientosCliente(req))
const manejarListarDocumentos  = controlar(req => listarDocumentosCliente(req))
const manejarUrlDescargaDocumento = controlar(req => obtenerUrlDescargaDocumentoCliente(req))
const manejarSubirDocumento = controlar(req => subirDocumentoACliente(req), { crear: true })

module.exports = {
  manejarListar, manejarEstadisticas, manejarVerificarCedula, manejarCrear, manejarObtenerDetalle,
  manejarPerfil, manejarListarMovimientos, manejarListarDocumentos, manejarUrlDescargaDocumento,
  manejarSubirDocumento,
}
