'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearPlantilla } = require('./plantillasCredito.validator')
const { manejarListar, manejarCrear, manejarMora } = require('./plantillasCredito.controller')

const router = Router()

router.use(authTenant)

// /mora debe registrarse antes que cualquier /:id genérico si en el futuro se
// agrega uno — hoy no hay conflicto de rutas.
// Reutiliza los permisos de CREDITOS (ver/crear) — las plantillas de crédito son
// configuración de ese mismo dominio y no existe un ModuloPermiso propio para
// "plantillas"/"intereses" en el catálogo (agregar uno implicaría migración de
// schema, fuera de alcance de esta página).
router.get('/',     requierePermiso('creditos.ver'),   manejarListar)
router.get('/mora', requierePermiso('creditos.ver'),   manejarMora)
router.post('/',    requierePermiso('creditos.crear'), validarCrearPlantilla, manejarCrear)

module.exports = router
