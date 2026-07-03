'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../lib/validar')

const esquemaLogin = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida'),
})

const esquemaCambioPassword = z.object({
  contrasenaActual: z.string().min(1, 'Contraseña actual requerida'),
  nuevaContrasena: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmarContrasena: z.string().min(1, 'Confirmación requerida'),
}).refine(d => d.nuevaContrasena === d.confirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarContrasena'],
})

const validarLogin          = crearValidador(esquemaLogin)
const validarCambioPassword = crearValidador(esquemaCambioPassword)

module.exports = { validarLogin, validarCambioPassword }
