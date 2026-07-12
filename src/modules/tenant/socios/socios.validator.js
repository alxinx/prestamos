'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona } = require('../../../lib/validar')

// nombreCompleto se normaliza a Título (regla general de nombres de persona en formularios).
const esquemaCrearSocio = z.object({
  nombreCompleto: esquemaNombrePersona('El nombre es requerido', 150),
  cedula:         z.string().min(1, 'La cédula es requerida').max(30),
  telefono:       z.string().max(30).optional().or(z.literal('')),
  email:          z.string().email('Correo electrónico inválido').toLowerCase().optional().or(z.literal('')),
})

const esquemaSuspenderSocio = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
})

const validarCrearSocio = crearValidador(esquemaCrearSocio)
const validarSuspenderSocio = crearValidador(esquemaSuspenderSocio)

module.exports = { validarCrearSocio, validarSuspenderSocio }
