'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { authLimiter } = require('../../../middleware/rateLimiter')
const { validarCrearSocio, validarSuspenderSocio } = require('./socios.validator')
const { manejarListar, manejarCrear, manejarSuspender, manejarReactivar } = require('./socios.controller')

const router = Router()

router.use(authTenant)

// El catálogo de permisos agrupa socios bajo "capital.*" (ver descripción en
// permisos.catalogo.js: "Consultar fuentes de capital y socios").
router.get('/',  requierePermiso('capital.ver'),   manejarListar)
router.post('/', requierePermiso('capital.crear'), validarCrearSocio, manejarCrear)
// Suspender exige permiso de eliminar + reconfirmar contraseña (ver socios.service.js).
router.patch('/:id/suspender', requierePermiso('capital.eliminar'), authLimiter, validarSuspenderSocio, manejarSuspender)
// Reactivar exige permiso de crear, sin contraseña — acción reversible.
router.patch('/:id/reactivar', requierePermiso('capital.crear'), manejarReactivar)

module.exports = router
