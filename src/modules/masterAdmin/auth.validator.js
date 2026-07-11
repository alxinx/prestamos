'use strict'

const { z } = require('zod')
const { crearValidador, esquemaContrasena } = require('../../lib/validar')

const esquemaLogin = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida'),
})

const esquemaCambioPassword = z.object({
  contrasenaActual: z.string().min(1, 'Contraseña actual requerida'),
  nuevaContrasena: esquemaContrasena,
  confirmarContrasena: z.string().min(1, 'Confirmación requerida'),
}).refine(d => d.nuevaContrasena === d.confirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarContrasena'],
})

const validarLogin          = crearValidador(esquemaLogin)
const validarCambioPassword = crearValidador(esquemaCambioPassword)

module.exports = { validarLogin, validarCambioPassword }
