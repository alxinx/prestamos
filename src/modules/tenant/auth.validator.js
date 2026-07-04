'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../lib/validar')

const esquemaLogin = z.object({
  email:    z.string().email('Correo electrónico inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida'),
})

const validarLogin = crearValidador(esquemaLogin)

const validarSolicitarRecuperacion = crearValidador(z.object({
  email: z.string().email('Correo inválido').toLowerCase(),
}))

const validarRestablecerContrasena = crearValidador(z.object({
  token:    z.string().min(1, 'Token requerido'),
  password: z.string()
    .min(8,    'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
}))

module.exports = { validarLogin, validarSolicitarRecuperacion, validarRestablecerContrasena }
