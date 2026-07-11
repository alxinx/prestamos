'use strict'

const { z } = require('zod')
const { crearValidador, esquemaContrasena } = require('../../lib/validar')

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
  password: esquemaContrasena,
}))

module.exports = { validarLogin, validarSolicitarRecuperacion, validarRestablecerContrasena }
