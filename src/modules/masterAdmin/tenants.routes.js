'use strict'

const { Router } = require('express')
const authMasterAdmin = require('../../middleware/authMasterAdmin')
const { validarTenant } = require('./tenants.validator')
const { manejarListar, manejarObtener, manejarCrear, manejarActualizar, manejarReenviarActivacion, manejarEliminarUltimo, manejarVerificarEmail } = require('./tenants.controller')

const router = Router()

router.use(authMasterAdmin)

router.get('/', manejarListar)
router.get('/verificar-email', manejarVerificarEmail)
router.get('/:id', manejarObtener)
router.post('/', validarTenant, manejarCrear)
router.put('/:id', validarTenant, manejarActualizar)
router.post('/:id/reenviar-activacion', manejarReenviarActivacion)
router.delete('/dev/ultimo', manejarEliminarUltimo)

module.exports = router
