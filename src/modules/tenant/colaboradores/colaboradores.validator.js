'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../../lib/validar')

const esquemaPassword = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')

const esquemaCrearColaborador = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es requerido').max(150),
  cedula:         z.string().min(1, 'La cédula es requerida').max(30),
  telefono:       z.string().min(1, 'El teléfono es requerido').max(30),
  email:          z.string().email('Correo electrónico inválido').toLowerCase(),
  password:       esquemaPassword,
  cargo:          z.string().max(100).optional().or(z.literal('')),
  rolId:          z.string().uuid('Rol inválido'),
})

const validarCrearColaborador = crearValidador(esquemaCrearColaborador)

module.exports = { validarCrearColaborador }
