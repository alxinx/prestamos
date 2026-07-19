'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const { manejarEstado, manejarFinalizar } = require('./onboarding.controller')

const router = Router()

router.use(authTenant)

// Sin requierePermiso adicional (mismo criterio que /auth/me y /auth/permisos):
// quien llega hasta acá siempre es el super admin del tenant — nadie más puede
// existir todavía sin que el wizard se haya completado — y esSuperAdmin ya
// salta cualquier chequeo de permiso igualmente.
router.get('/estado',      manejarEstado)
router.post('/finalizar',  manejarFinalizar)

module.exports = router
