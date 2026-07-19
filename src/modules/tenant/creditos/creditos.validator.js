'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona } = require('../../../lib/validar')

const TIPOS_GARANTIA = ['MOTO', 'VEHICULO', 'ELECTRODOMESTICO', 'PAGARE', 'LETRA_CAMBIO', 'DOCUMENTO_FIRMADO', 'INMUEBLE', 'OTRO']
const RELACIONES_PERSONA = ['FAMILIAR', 'AMIGO', 'COLEGA', 'VECINO', 'OTRO']
const FRECUENCIAS_PAGO = ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL']

const esquemaGarantia = z.object({
  tipo:          z.enum(TIPOS_GARANTIA, { errorMap: () => ({ message: 'Tipo de garantía inválido' }) }),
  descripcion:   z.string().min(1, 'La descripción de la garantía es requerida').max(2000),
  valorEstimado: z.number().nonnegative('El valor estimado no puede ser negativo').optional().nullable(),
})

// nombreCompleto se normaliza a Título (regla general de nombres de persona en formularios).
const esquemaDeudorSolidario = z.object({
  clienteId:         z.string().uuid().optional().nullable(),
  nombreCompleto:    esquemaNombrePersona('El nombre del deudor solidario es requerido', 150),
  cedula:            z.string().min(1, 'La cédula del deudor solidario es requerida').max(30),
  telefono:          z.string().min(1, 'El teléfono del deudor solidario es requerido').max(30),
  direccion:         z.string().max(255).optional().or(z.literal('')),
  relacionConDeudor: z.enum(RELACIONES_PERSONA, { errorMap: () => ({ message: 'Relación inválida' }) }),
  firmoDocumento:    z.boolean(),
})

// El formulario viaja como multipart/form-data (lleva los adjuntos de la
// garantía), así que los campos numéricos llegan como string — z.coerce.number()
// los convierte antes de validar (mismo motivo por el que ubicaciones/referencias
// del cliente viajan como JSON stringificado, ver clientes.validator.js). garantia
// y deudorSolidario se parsean con esquemaGarantia/esquemaDeudorSolidario dentro
// del servicio, no aquí — Zod solo puede confirmar que son strings en esta capa.
const esquemaCrearCredito = z.object({
  plantillaId:    z.string().uuid().optional().or(z.literal('')),
  clienteId:      z.string().uuid('Selecciona un cliente'),
  cobradorId:     z.string().uuid('Selecciona un cobrador'),
  cajaId:         z.string().uuid('Selecciona una caja de capital'),
  montoInicial:   z.coerce.number().positive('El monto del préstamo debe ser mayor a 0'),
  tasaInteres:    z.coerce.number().positive('La tasa de interés debe ser mayor a 0'),
  // 0 = crédito de solo intereses, sin plazo fijo (decisión 2026-07-16) — nunca negativo.
  numeroCuotas:   z.coerce.number().int().nonnegative('El número de cuotas no puede ser negativo'),
  frecuenciaPago: z.enum(FRECUENCIAS_PAGO, { errorMap: () => ({ message: 'Frecuencia de pago inválida' }) }),
  fechaInicio:    z.string().min(1, 'La fecha de inicio es requerida'),
  fechaLetra:     z.string().optional().or(z.literal('')),
  // Preferencia de redondeo de la cuota al múltiplo de 1.000 — se persiste
  // (ver Credito.redondearCuotaMil), llega como "true"/"false" por multipart.
  redondearCuotaMil: z.enum(['true', 'false']),
  garantia:       z.string().min(1, 'La garantía es requerida'),
  deudorSolidario: z.string().optional().or(z.literal('')),
})

const validarCrearCredito = crearValidador(esquemaCrearCredito)

// Cada campo opcional de la letra de cambio (valor, beneficiario, fecha de
// vencimiento) solo es requerido si su interruptor "incluye*" está en true —
// si el operador lo apaga, el campo no viaja o llega null/undefined y el
// documento lo deja en blanco (ver CLAUDE.md nota Art. 622 C.Co.).
// `beneficiario` no se normaliza a Título: puede ser un nombre comercial
// (ej. "GotaPay S.A.S.") y no solo el de una persona (regla de nombres de
// persona no aplica acá).
const esquemaGenerarLetraCambio = z.object({
  incluyeValor:        z.boolean(),
  valor:                z.number().positive('El valor debe ser mayor a 0').optional().nullable(),
  incluyeBeneficiario: z.boolean(),
  beneficiario:         z.string().trim().min(1).max(150).optional().nullable(),
  incluyeFecha:        z.boolean(),
  fechaVencimiento:     z.string().optional().nullable(),
})
  .refine(d => !d.incluyeValor || d.valor != null, { message: 'Debes indicar el valor de la letra', path: ['valor'] })
  .refine(d => !d.incluyeBeneficiario || !!d.beneficiario, { message: 'Debes indicar a favor de quién es la letra', path: ['beneficiario'] })
  .refine(d => !d.incluyeFecha || !!d.fechaVencimiento, { message: 'Debes indicar la fecha de vencimiento', path: ['fechaVencimiento'] })
  .refine(d => !d.incluyeFecha || !Number.isNaN(Date.parse(d.fechaVencimiento)), { message: 'Fecha de vencimiento inválida', path: ['fechaVencimiento'] })
  .refine(d => !d.incluyeFecha || Number.isNaN(Date.parse(d.fechaVencimiento)) || new Date(d.fechaVencimiento) >= new Date(new Date().toDateString()), {
    message: 'La fecha de vencimiento no puede ser anterior a hoy',
    path: ['fechaVencimiento'],
  })

const validarGenerarLetraCambio = crearValidador(esquemaGenerarLetraCambio)

module.exports = {
  validarCrearCredito,
  esquemaGarantia,
  esquemaDeudorSolidario,
  validarGenerarLetraCambio,
}
