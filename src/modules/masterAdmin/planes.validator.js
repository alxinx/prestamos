'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../lib/validar')

const limiteEntero = z.union([
  z.literal(-1),
  z.number().int().nonnegative(),
], { errorMap: () => ({ message: 'Debe ser un número entero positivo o -1 (ilimitado)' }) })

const esquemaPlan = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  precio: z.number().nonnegative('El precio no puede ser negativo'),
  limitePrestamos: limiteEntero,
  limiteCobradores: limiteEntero,
  limiteMensajesWsp: limiteEntero,
  consultasScore: limiteEntero,
  tieneBot: z.boolean(),
  tienePortalCliente: z.boolean(),
  tieneFirmaDigital: z.boolean(),
  precioPrestamoAdicional: z.number().nonnegative('El precio adicional no puede ser negativo'),
  precioColaboradorAdicional: z.number().nonnegative('El precio de colaborador adicional no puede ser negativo'),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional().default('ACTIVO'),
})

const esquemaConfigPlan = z.object({
  precio: z.number().nonnegative('El precio no puede ser negativo'),
  limitePrestamos: limiteEntero,
  limiteCobradores: limiteEntero,
  limiteMensajesWsp: limiteEntero,
  consultasScore: limiteEntero,
  precioPrestamoAdicional: z.number().nonnegative('El precio adicional no puede ser negativo'),
  precioColaboradorAdicional: z.number().nonnegative('El precio de colaborador adicional no puede ser negativo'),
})

const validarPlan       = crearValidador(esquemaPlan)
const validarConfigPlan = crearValidador(esquemaConfigPlan)

module.exports = { validarPlan, validarConfigPlan }
