'use strict'

const { Router } = require('express')
const authMasterAdmin = require('../../middleware/authMasterAdmin')
const { validarPlan, validarConfigPlan } = require('./planes.validator')
const { manejarListar, manejarObtener, manejarCrear, manejarActualizar, manejarCambiarEstado, manejarActualizarConfig } = require('./planes.controller')

const router = Router()

router.use(authMasterAdmin)

router.get('/', manejarListar)
router.get('/:id', manejarObtener)
router.post('/', validarPlan, manejarCrear)
router.put('/:id', validarPlan, manejarActualizar)
router.patch('/:id/estado', manejarCambiarEstado)
router.patch('/:id/config', validarConfigPlan, manejarActualizarConfig)

module.exports = router
