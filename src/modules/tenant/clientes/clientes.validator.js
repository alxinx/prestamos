'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona } = require('../../../lib/validar')

const TIPOS_UBICACION = ['RESIDENCIA', 'TRABAJO', 'NEGOCIO_PROPIO', 'DONDE_SE_FIRMO', 'FAMILIAR', 'OTRO']
const RELACIONES_PERSONA = ['FAMILIAR', 'AMIGO', 'COLEGA', 'VECINO', 'OTRO']

// nombreCompleto se normaliza a Título (regla general de nombres de persona en formularios).
const esquemaUbicacion = z.object({
  tipo:             z.enum(TIPOS_UBICACION, { errorMap: () => ({ message: 'Tipo de ubicación inválido' }) }),
  direccion:        z.string().min(1, 'La dirección es requerida').max(255),
  ciudad:           z.string().min(1, 'La ciudad es requerida').max(100),
  barrio:           z.string().max(100).optional().or(z.literal('')),
  referencia:       z.string().max(1000).optional().or(z.literal('')),
  horarioUbicacion: z.string().max(150).optional().or(z.literal('')),
  latitud:          z.number().min(-90).max(90).optional().nullable(),
  longitud:         z.number().min(-180).max(180).optional().nullable(),
})

const esquemaReferencia = z.object({
  nombreCompleto:     esquemaNombrePersona('El nombre de la referencia es requerido', 150),
  telefono:           z.string().min(1, 'El teléfono de la referencia es requerido').max(30),
  relacionConCliente: z.enum(RELACIONES_PERSONA, { errorMap: () => ({ message: 'Relación inválida' }) }),
  observaciones:      z.string().max(1000).optional().or(z.literal('')),
})

const esquemaUbicaciones = z.array(esquemaUbicacion).min(1, 'Registra al menos una ubicación')
const esquemaReferencias = z.array(esquemaReferencia).max(2, 'Máximo 2 referencias personales')

// El formulario viaja como multipart/form-data (lleva archivos adjuntos), así que
// los campos anidados (ubicaciones, referencias, documentosMeta) llegan como JSON
// stringificado en campos de texto — mismo patrón que documentosMeta en
// colaboradores.validator.js. Se parsean y validan con esquemaUbicaciones/
// esquemaReferencias dentro del servicio, no aquí (Zod solo puede confirmar que
// es un string en esta capa multipart).
//
// nombreCompleto/telefono/fechaNacimiento son opcionales aquí a propósito: solo
// son obligatorios cuando la cédula no existe todavía en ClienteGlobal, y eso
// depende de una consulta a la DB — esa parte se valida en el servicio.
const esquemaCrearCliente = z.object({
  cedula:          z.string().min(1, 'La cédula es requerida').max(30),
  nombreCompleto:  z.string().max(150).optional().or(z.literal('')),
  telefono:        z.string().max(30).optional().or(z.literal('')),
  fechaNacimiento: z.string().optional().or(z.literal('')),
  zonaId:          z.string().uuid().optional().or(z.literal('')),
  cobradorId:      z.string().uuid().optional().or(z.literal('')),
  observaciones:   z.string().max(2000).optional().or(z.literal('')),
  ubicaciones:     z.string().min(1, 'Registra al menos una ubicación'),
  referencias:     z.string().optional().or(z.literal('')),
  documentosMeta:  z.string().optional(),
  consentimientoTratamientoDatos:   z.enum(['true', 'false']).refine(v => v === 'true', 'Debes autorizar el tratamiento de datos'),
  consentimientoCompartirScore:     z.enum(['true', 'false']).optional(),
  consentimientoNotificacionesWsp:  z.enum(['true', 'false']).optional(),
})

const validarCrearCliente = crearValidador(esquemaCrearCliente)

module.exports = {
  validarCrearCliente,
  esquemaUbicaciones,
  esquemaReferencias,
  TIPOS_UBICACION,
  RELACIONES_PERSONA,
}
