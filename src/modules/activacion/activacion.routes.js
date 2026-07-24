'use strict'

const { Router } = require('express')
const { z } = require('zod')
const { crearValidador, esquemaContrasena } = require('../../lib/validar')
const { controlar } = require('../../lib/controlador')
const { authLimiter } = require('../../middleware/rateLimiter')
const { verificarToken, completarActivacion } = require('./activacion.service')

const validarVerificar = crearValidador(z.object({
  token: z.string().min(1, 'Token requerido'),
  email: z.string().email('Email inválido'),
}))

const validarCompletar = crearValidador(z.object({
  token:          z.string().min(1),
  email:          z.string().email(),
  nombreCompleto: z.string().min(1, 'El nombre es requerido'),
  password:       esquemaContrasena,
}))

const router = Router()

// authLimiter (CLAUDE.md §6): sin esto, /verificar es un oráculo público de
// fuerza bruta sobre el token de activación (token+email, sin autenticación).
router.post('/verificar', authLimiter, validarVerificar, controlar(req => verificarToken(req.body)))
router.post('/completar', authLimiter, validarCompletar, controlar(req => completarActivacion(req.body)))

module.exports = router
