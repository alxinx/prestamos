'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../../lib/validar')

// Campos de condiciones compartidos entre crear y editar — una plantilla no
// cambia de "forma" al editarse, solo de valores (ver campos comunes de
// esquemaCrearPlantilla/esquemaEditarPlantilla).
const camposCondiciones = {
  nombre:      z.string().min(1, 'El nombre es requerido').max(150),
  plazo:       z.number().int().positive('El plazo debe ser mayor a 0'),
  tasaInteres: z.number().positive('La tasa de interés debe ser mayor a 0'),
  // 0 = cuotas indefinidas (sin número fijo de cuotas) — nunca negativo.
  numeroCuotas:   z.number().int().nonnegative('El número de cuotas no puede ser negativo'),
  frecuenciaPago: z.enum(['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'], { errorMap: () => ({ message: 'Frecuencia de pago inválida' }) }),
  // 0 = sin límite — nunca negativo.
  montoMinimo: z.number().nonnegative('El monto mínimo no puede ser negativo'),
  montoMaximo: z.number().nonnegative('El monto máximo no puede ser negativo'),
  interesMoraActivo: z.boolean(),
  porcentajeMora:    z.number().positive('El % de mora debe ser mayor a 0').nullable().optional(),
  baseCalculoMora:   z.enum(['INTERES', 'CAPITAL'], { errorMap: () => ({ message: 'Base de cálculo de mora inválida' }) }).nullable().optional(),
  diasGraciaMora:    z.number().int().nonnegative('Los días de gracia no pueden ser negativos'),
}

const refinamientosCondiciones = esquema => esquema
  .refine(d => d.montoMaximo === 0 || d.montoMaximo >= d.montoMinimo, {
    message: 'El monto máximo debe ser mayor o igual al monto mínimo (o 0 para indicar sin límite)',
    path: ['montoMaximo'],
  })
  .refine(d => !d.interesMoraActivo || d.baseCalculoMora, {
    message: 'Selecciona si el interés por mora se calcula sobre el interés o sobre el capital',
    path: ['baseCalculoMora'],
  })
  .refine(d => !d.interesMoraActivo || d.porcentajeMora, {
    message: 'El % de mora es requerido si vas a cobrar interés por mora',
    path: ['porcentajeMora'],
  })

const esquemaCrearPlantilla = refinamientosCondiciones(z.object(camposCondiciones))
const esquemaEditarPlantilla = refinamientosCondiciones(z.object(camposCondiciones))

const esquemaCambiarEstadoPlantilla = z.object({
  estado: z.enum(['ACTIVA', 'INACTIVA'], { errorMap: () => ({ message: 'Estado inválido' }) }),
})

const validarCrearPlantilla = crearValidador(esquemaCrearPlantilla)
const validarEditarPlantilla = crearValidador(esquemaEditarPlantilla)
const validarCambiarEstadoPlantilla = crearValidador(esquemaCambiarEstadoPlantilla)

module.exports = { validarCrearPlantilla, validarEditarPlantilla, validarCambiarEstadoPlantilla }
