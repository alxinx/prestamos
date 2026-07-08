'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearColaborador } = require('./colaboradores.validator')
const { manejarListar, manejarListarRoles, manejarCrear, manejarCambiarEstado } = require('./colaboradores.controller')

const MAX_DOCUMENTO_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024
const subirDocumentos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('documentosArchivos', 10)

const router = Router()

router.use(authTenant)

router.get('/',              requierePermiso('empleados.ver'),    manejarListar)
router.get('/roles',         requierePermiso('empleados.ver'),    manejarListarRoles)
router.post('/',             requierePermiso('empleados.crear'),  subirDocumentos, validarCrearColaborador, manejarCrear)
router.patch('/:id/estado',  requierePermiso('empleados.editar'), manejarCambiarEstado)

module.exports = router
