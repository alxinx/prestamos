'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona } = require('../../lib/validar')

const esquemaTenant = z.object({
  planId: z.string().uuid('Plan inválido'),
  // nombreNegocio y razonSocial NO se normalizan a Título: pueden llevar mayúsculas
  // intencionales o siglas legales (ej. "S.A.S.") que ese transform rompería.
  nombreNegocio: z.string().min(2, 'El nombre del negocio es requerido').max(150),
  tipoPersona: z.enum(['NATURAL', 'JURIDICA']),
  nombreCompleto: esquemaNombrePersona('El nombre completo es requerido', 200, 2),
  razonSocial: z.string().max(200).optional().nullable(),
  tipoIdentificacion: z.enum(['NIT', 'CC', 'CE', 'PASAPORTE']),
  numeroIdentificacion: z.string().min(3, 'El número de identificación es requerido').max(30),
  email: z.string().email('Correo electrónico inválido').toLowerCase(),
  telefono: z.string().max(20).optional().nullable(),
  estado: z.enum(['ACTIVO', 'PERIODO_GRACIA', 'SUSPENDIDO', 'CANCELADO']).optional().default('ACTIVO'),
  fechaInicio: z.string().datetime({ message: 'Fecha de inicio inválida' }).optional(),
})

const validarTenant = crearValidador(esquemaTenant)

module.exports = { validarTenant }
