'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarCrearPlantilla, validarEditarPlantilla, validarCambiarEstadoPlantilla } = require('./plantillasCredito.validator')
const { manejarListar, manejarCrear, manejarEditar, manejarCambiarEstado, manejarMora } = require('./plantillasCredito.controller')

const router = Router()

router.use(authTenant)

// /mora debe registrarse antes que cualquier /:id genérico si en el futuro se
// agrega uno — hoy no hay conflicto de rutas.
// Reutiliza los permisos de CREDITOS (ver/crear/editar/cambiar_estado) — las
// plantillas de crédito son configuración de ese mismo dominio y no existe un
// ModuloPermiso propio para "plantillas"/"intereses" en el catálogo (agregar
// uno implicaría migración de schema, fuera de alcance de esta página).
router.get('/',              requierePermiso('creditos.ver'),            manejarListar)
router.get('/mora',          requierePermiso('creditos.ver'),            manejarMora)
router.post('/',             requierePermiso('creditos.crear'),          validarCrearPlantilla, manejarCrear)
router.put('/:id',           requierePermiso('creditos.editar'),         validarEditarPlantilla, manejarEditar)
router.patch('/:id/estado',  requierePermiso('creditos.cambiar_estado'), validarCambiarEstadoPlantilla, manejarCambiarEstado)

module.exports = router
