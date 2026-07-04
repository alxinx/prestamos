'use strict'

const { Router } = require('express')
const { z } = require('zod')
const authMasterAdmin = require('../../middleware/authMasterAdmin')
const { crearValidador } = require('../../lib/validar')
const { manejarObtener, manejarGuardar } = require('./datosSaas.controller')

const validarDatosSaas = crearValidador(z.object({
  nombreRazonSocial: z.string().min(1, 'El nombre o razón social es requerido').max(200),
  nit:               z.string().min(1, 'El NIT es requerido').max(20),
  email:             z.string().email('Email inválido').max(150),
}))

const router = Router()

router.use(authMasterAdmin)

router.get('/', manejarObtener)
router.put('/', validarDatosSaas, manejarGuardar)

module.exports = router
