'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearColaborador } = require('./colaboradores.validator')
const { manejarListar, manejarListarRoles, manejarCrear, manejarCambiarEstado } = require('./colaboradores.controller')

const router = Router()

router.use(authTenant)

router.get('/',              requierePermiso('empleados.ver'),    manejarListar)
router.get('/roles',         requierePermiso('empleados.ver'),    manejarListarRoles)
router.post('/',             requierePermiso('empleados.crear'),  validarCrearColaborador, manejarCrear)
router.patch('/:id/estado',  requierePermiso('empleados.editar'), manejarCambiarEstado)

module.exports = router
