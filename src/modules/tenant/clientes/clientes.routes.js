'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearCliente } = require('./clientes.validator')
const { manejarListar, manejarEstadisticas, manejarVerificarCedula, manejarCrear } = require('./clientes.controller')
const { MAX_DOCUMENTO_BYTES } = require('../../../lib/documentos')

const subirDocumentos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('documentosArchivos', 10)

const router = Router()

router.use(authTenant)

// /verificar-cedula y /estadisticas deben registrarse antes de cualquier /:id
// genérico si en el futuro se agrega uno — hoy no hay conflicto de rutas.
router.get('/',                       requierePermiso('clientes.ver'),   manejarListar)
router.get('/estadisticas',           requierePermiso('clientes.ver'),   manejarEstadisticas)
router.get('/verificar-cedula/:cedula', requierePermiso('clientes.crear'), manejarVerificarCedula)
router.post('/', requierePermiso('clientes.crear'), subirDocumentos, validarCrearCliente, manejarCrear)

module.exports = router
