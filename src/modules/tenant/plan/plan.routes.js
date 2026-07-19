'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { manejarLimitePrestamos, manejarLimiteColaboradores, manejarOpciones } = require('./plan.controller')

const router = Router()

router.use(authTenant)

// Mismo permiso que protege el wizard "Nuevo préstamo" — son las únicas
// pantallas que consumen estas rutas.
router.get('/limite-prestamos', requierePermiso('creditos.crear'), manejarLimitePrestamos)
// Mismo permiso que protege el formulario "Nuevo colaborador".
router.get('/limite-colaboradores', requierePermiso('empleados.crear'), manejarLimiteColaboradores)
// Catálogo de planes — sin permiso específico: cualquier empleado autenticado
// puede verlo (lo consumen los avisos de límite de préstamos y colaboradores,
// y no expone nada sensible, solo precio/límites/features de cada plan).
router.get('/opciones', manejarOpciones)

module.exports = router
