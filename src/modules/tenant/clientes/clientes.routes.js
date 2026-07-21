'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearCliente } = require('./clientes.validator')
const {
  manejarListar, manejarEstadisticas, manejarVerificarCedula, manejarCrear, manejarObtenerDetalle,
  manejarPerfil, manejarListarMovimientos, manejarListarDocumentos, manejarUrlDescargaDocumento,
  manejarSubirDocumento,
} = require('./clientes.controller')
const { MAX_DOCUMENTO_BYTES } = require('../../../lib/documentos')

const subirDocumentos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('documentosArchivos', 10)

const subirUnDocumento = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES },
}).single('archivo')

const router = Router()

router.use(authTenant)

// /verificar-cedula y /estadisticas deben registrarse antes de /:id genérico.
router.get('/',                       requierePermiso('clientes.ver'),   manejarListar)
router.get('/estadisticas',           requierePermiso('clientes.ver'),   manejarEstadisticas)
router.get('/verificar-cedula/:cedula', requierePermiso('clientes.crear'), manejarVerificarCedula)
router.post('/', requierePermiso('clientes.crear'), subirDocumentos, validarCrearCliente, manejarCrear)
router.get('/:id/perfil', requierePermiso('clientes.ver'), manejarPerfil)
router.get('/:id/pagos', requierePermiso('cobros.ver'), manejarListarMovimientos)
router.get('/:id/documentos', requierePermiso('clientes.ver'), manejarListarDocumentos)
router.post('/:id/documentos', requierePermiso('clientes.editar'), subirUnDocumento, manejarSubirDocumento)
router.get('/:id/documentos/:documentoId/descargar', requierePermiso('clientes.ver'), manejarUrlDescargaDocumento)
router.get('/:id', requierePermiso('clientes.ver'), manejarObtenerDetalle)

module.exports = router
