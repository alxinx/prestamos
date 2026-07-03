'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../lib/validar')

const esquemaTenant = z.object({
  planId: z.string().uuid('Plan inválido'),
  nombreNegocio: z.string().min(2, 'El nombre del negocio es requerido').max(150),
  tipoPersona: z.enum(['NATURAL', 'JURIDICA']),
  nombreCompleto: z.string().min(2, 'El nombre completo es requerido').max(200),
  razonSocial: z.string().max(200).optional().nullable(),
  tipoIdentificacion: z.enum(['NIT', 'CC', 'CE', 'PASAPORTE']),
  numeroIdentificacion: z.string().min(3, 'El número de identificación es requerido').max(30),
  email: z.string().email('Correo electrónico inválido').toLowerCase(),
  telefono: z.string().max(20).optional().nullable(),
  estado: z.enum(['ACTIVO', 'PERIODO_GRACIA', 'SUSPENDIDO', 'CANCELADO']).optional().default('ACTIVO'),
  fechaInicio: z.string().datetime({ message: 'Fecha de inicio inválida' }).optional(),
})

const esquemaActualizarEstado = z.object({
  estado: z.enum(['ACTIVO', 'PERIODO_GRACIA', 'SUSPENDIDO', 'CANCELADO']),
})

const validarTenant          = crearValidador(esquemaTenant)
const validarActualizarEstado = crearValidador(esquemaActualizarEstado)

module.exports = { validarTenant, validarActualizarEstado }
