'use strict'

const {
  estadisticasCreditos, creditosEnMora, listarCreditos, simularCredito, crearCredito,
  obtenerDetalleCredito, obtenerCronogramaCredito,
  listarDocumentosCredito, obtenerUrlDescargaDocumentoCredito, subirDocumentoACredito,
} = require('./creditos.service')
const { generarLetraCambio } = require('./letraCambio.service')
const { controlar } = require('../../../lib/controlador')

const manejarEstadisticas    = controlar(req => estadisticasCreditos(req))
const manejarMora            = controlar(req => creditosEnMora(req))
const manejarListar          = controlar(req => listarCreditos(req))
const manejarSimular         = controlar(req => simularCredito(req))
const manejarCrear           = controlar(req => crearCredito(req), { crear: true })
const manejarGenerarLetraCambio = controlar(req => generarLetraCambio(req), { crear: true })
const manejarObtenerDetalle  = controlar(req => obtenerDetalleCredito(req))
const manejarCronograma      = controlar(req => obtenerCronogramaCredito(req))
const manejarListarDocumentos = controlar(req => listarDocumentosCredito(req))
const manejarUrlDescargaDocumento = controlar(req => obtenerUrlDescargaDocumentoCredito(req))
const manejarSubirDocumento = controlar(req => subirDocumentoACredito(req), { crear: true })

module.exports = {
  manejarEstadisticas, manejarMora, manejarListar, manejarSimular, manejarCrear, manejarGenerarLetraCambio,
  manejarObtenerDetalle, manejarCronograma,
  manejarListarDocumentos, manejarUrlDescargaDocumento, manejarSubirDocumento,
}
