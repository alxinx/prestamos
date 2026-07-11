'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona, normalizarTitulo } = require('../../../lib/validar')

// Campos base compartidos por crear/actualizar — evita que las reglas (ej. el
// max() de cedula) diverjan en silencio entre los dos flujos.
// nombreCompleto y cargo se normalizan a Título ("Alejandro Gonzalez") — nunca
// nombreNegocio/razonSocial en otros módulos, que pueden llevar mayúsculas o
// siglas legales intencionales.
const esquemaBaseColaborador = z.object({
  nombreCompleto: esquemaNombrePersona('El nombre es requerido', 150),
  cedula:         z.string().min(1, 'La cédula es requerida').max(30),
  telefono:       z.string().min(1, 'El teléfono es requerido').max(30),
  email:          z.string().email('Correo electrónico inválido').toLowerCase(),
  cargo:          z.string().max(100).optional().or(z.literal('')).transform(v => v ? normalizarTitulo(v) : v),
  rolId:          z.string().uuid('Rol inválido'),
})

const esquemaCrearColaborador = esquemaBaseColaborador.extend({
  // JSON.stringify([{ nombre: '...' }, ...]) — uno por archivo en el mismo orden que
  // los archivos subidos vía multipart (campo "documentosArchivos").
  documentosMeta: z.string().optional(),
})

const esquemaActualizarColaborador = esquemaBaseColaborador

const esquemaActualizarPermisos = z.object({
  permisos: z.array(z.object({
    codigo: z.string().min(1),
    activo: z.boolean(),
  })),
})

const validarCrearColaborador = crearValidador(esquemaCrearColaborador)
const validarActualizarColaborador = crearValidador(esquemaActualizarColaborador)
const validarActualizarPermisos = crearValidador(esquemaActualizarPermisos)

module.exports = { validarCrearColaborador, validarActualizarColaborador, validarActualizarPermisos }
