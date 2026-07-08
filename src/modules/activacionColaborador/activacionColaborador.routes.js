'use strict'

const { Router } = require('express')
const { z } = require('zod')
const { crearValidador } = require('../../lib/validar')
const { controlar } = require('../../lib/controlador')
const { verificarToken, completarActivacion } = require('./activacionColaborador.service')

const validarVerificar = crearValidador(z.object({
  token: z.string().min(1, 'Token requerido'),
  email: z.string().email('Email inválido'),
}))

const validarCompletar = crearValidador(z.object({
  token:    z.string().min(1),
  email:    z.string().email(),
  password: z.string()
    .min(8,    'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
}))

const router = Router()

router.post('/verificar', validarVerificar, controlar(req => verificarToken(req.body)))
router.post('/completar', validarCompletar, controlar(req => completarActivacion(req.body)))

module.exports = router
