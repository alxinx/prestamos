'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../../lib/validar')

const esquemaCrearColaborador = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es requerido').max(150),
  cedula:         z.string().min(1, 'La cédula es requerida').max(30),
  telefono:       z.string().min(1, 'El teléfono es requerido').max(30),
  email:          z.string().email('Correo electrónico inválido').toLowerCase(),
  cargo:          z.string().max(100).optional().or(z.literal('')),
  rolId:          z.string().uuid('Rol inválido'),
  // JSON.stringify([{ nombre: '...' }, ...]) — uno por archivo en el mismo orden que
  // los archivos subidos vía multipart (campo "documentosArchivos").
  documentosMeta: z.string().optional(),
})

const validarCrearColaborador = crearValidador(esquemaCrearColaborador)

module.exports = { validarCrearColaborador }
