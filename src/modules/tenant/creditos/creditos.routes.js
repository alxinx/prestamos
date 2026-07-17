'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearCredito } = require('./creditos.validator')
const { manejarEstadisticas, manejarMora, manejarListar, manejarSimular, manejarCrear } = require('./creditos.controller')
const { MAX_DOCUMENTO_BYTES } = require('../../../lib/documentos')

const subirGarantiaArchivos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('garantiaArchivos', 10)

const router = Router()

router.use(authTenant)

// /estadisticas, /mora y /simular deben registrarse antes de cualquier /:id
// genérico si en el futuro se agrega uno — hoy no hay conflicto de rutas.
router.get('/estadisticas', requierePermiso('creditos.ver'),   manejarEstadisticas)
router.get('/mora',         requierePermiso('creditos.ver'),   manejarMora)
router.post('/simular',     requierePermiso('creditos.crear'), manejarSimular)
router.get('/',              requierePermiso('creditos.ver'),   manejarListar)
router.post('/',             requierePermiso('creditos.crear'), subirGarantiaArchivos, validarCrearCredito, manejarCrear)

module.exports = router
