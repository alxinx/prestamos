'use strict'

const { Router } = require('express')
const multer = require('multer')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearColaborador, validarActualizarColaborador, validarActualizarPermisos } = require('./colaboradores.validator')
const {
  manejarListar, manejarListarRoles, manejarCrear, manejarObtener, manejarActualizar,
  manejarCambiarEstado, manejarPermisosDetalle, manejarPermisosGuardar,
  manejarListarDocumentos, manejarSubirDocumento, manejarEliminarDocumento, manejarUrlDescargaDocumento,
} = require('./colaboradores.controller')
const { MAX_DOCUMENTO_BYTES } = require('../../../lib/documentos')

const subirDocumentos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 10 },
}).array('documentosArchivos', 10)

const subirUnDocumento = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES, files: 1 },
}).single('archivo')

const router = Router()

router.use(authTenant)

router.get('/',              requierePermiso('empleados.ver'),    manejarListar)
router.get('/roles',         requierePermiso('empleados.ver'),    manejarListarRoles)
router.post('/',             requierePermiso('empleados.crear'),  subirDocumentos, validarCrearColaborador, manejarCrear)
router.get('/:id',           requierePermiso('empleados.ver'),    manejarObtener)
router.patch('/:id',         requierePermiso('empleados.editar'), validarActualizarColaborador, manejarActualizar)
router.patch('/:id/estado',  requierePermiso('empleados.editar'), manejarCambiarEstado)
router.get('/:id/permisos',  requierePermiso('empleados.gestionar_permisos'), manejarPermisosDetalle)
router.put('/:id/permisos',  requierePermiso('empleados.gestionar_permisos'), validarActualizarPermisos, manejarPermisosGuardar)

router.get('/:id/documentos',                        requierePermiso('empleados.ver'),    manejarListarDocumentos)
router.post('/:id/documentos',                       requierePermiso('empleados.editar'), subirUnDocumento, manejarSubirDocumento)
router.delete('/:id/documentos/:documentoId',        requierePermiso('empleados.editar'), manejarEliminarDocumento)
router.get('/:id/documentos/:documentoId/descargar', requierePermiso('empleados.ver'),    manejarUrlDescargaDocumento)

module.exports = router
