'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { authLimiter } = require('../../../middleware/rateLimiter')
const { validarCrearCapital, validarSuspenderCapital, validarAjustarCapital } = require('./capital.validator')
const { manejarListar, manejarObtener, manejarEstadisticas, manejarCrear, manejarSuspender, manejarReactivar, manejarAjustar } = require('./capital.controller')

const router = Router()

router.use(authTenant)

// /estadisticas debe registrarse antes de /:id — si no, Express la interpretaría
// como un id de capital.
router.get('/',                requierePermiso('capital.ver'),      manejarListar)
router.get('/estadisticas',    requierePermiso('capital.ver'),      manejarEstadisticas)
router.post('/',               requierePermiso('capital.crear'),    validarCrearCapital, manejarCrear)
router.get('/:id',             requierePermiso('capital.ver'),      manejarObtener)
// Suspender exige permiso de eliminar (misma capa de autorización que borrar un
// capital) + reconfirmar contraseña en el body (ver capital.service.js) + el mismo
// limiter usado en login, por ser una ruta que valida una contraseña.
router.patch('/:id/suspender', requierePermiso('capital.eliminar'), authLimiter, validarSuspenderCapital, manejarSuspender)
// Reactivar exige permiso de crear (simétrico con "volver a dar de alta") — no
// pide contraseña: es una acción reversible y menos destructiva que suspender.
router.patch('/:id/reactivar', requierePermiso('capital.crear'),    manejarReactivar)
// Ajustar capital exige permiso de editar — agrega o quita dinero de la caja
// (aporte/retiro manual), no requiere contraseña (a diferencia de suspender).
router.patch('/:id/ajustar-capital', requierePermiso('capital.editar'), validarAjustarCapital, manejarAjustar)

module.exports = router
