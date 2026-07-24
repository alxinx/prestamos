'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearCredito, validarGenerarLetraCambio } = require('./creditos.validator')
const {
  manejarEstadisticas, manejarMora, manejarListar, manejarSimular, manejarCrear, manejarGenerarLetraCambio,
  manejarObtenerDetalle, manejarCronograma,
  manejarListarDocumentos, manejarUrlDescargaDocumento, manejarSubirDocumento,
} = require('./creditos.controller')
const { MAX_DOCUMENTO_BYTES } = require('../../../lib/documentos')

const subirGarantiaArchivos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('garantiaArchivos', 10)

const subirUnDocumento = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES },
}).single('archivo')

const router = Router()

router.use(authTenant)

// /estadisticas, /mora y /simular deben registrarse antes de cualquier /:id
// genérico — /:id/letra-cambio ya es uno, por eso va después de estas.
router.get('/estadisticas', requierePermiso('creditos.ver'),   manejarEstadisticas)
router.get('/mora',         requierePermiso('creditos.ver'),   manejarMora)
router.post('/simular',     requierePermiso('creditos.crear'), manejarSimular)
router.get('/',              requierePermiso('creditos.ver'),   manejarListar)
router.post('/',             requierePermiso('creditos.crear'), subirGarantiaArchivos, validarCrearCredito, manejarCrear)
router.post('/:id/letra-cambio', requierePermiso('creditos.generar_letra'), validarGenerarLetraCambio, manejarGenerarLetraCambio)
router.get('/:id/cronograma', requierePermiso('creditos.ver'), manejarCronograma)
router.get('/:id/documentos', requierePermiso('creditos.ver'), manejarListarDocumentos)
router.post('/:id/documentos', requierePermiso('creditos.editar'), subirUnDocumento, manejarSubirDocumento)
router.get('/:id/documentos/:documentoId/descargar', requierePermiso('creditos.ver'), manejarUrlDescargaDocumento)
router.get('/:id', requierePermiso('creditos.ver'), manejarObtenerDetalle)

module.exports = router
