'use strict'

const { z } = require('zod')
const { crearValidador, esquemaNombrePersona } = require('../../../lib/validar')

// socioId es opcional (decisión 2026-07-18, wizard de configuración inicial):
// si no se manda, crearCapital en capital.service.js usa/crea automáticamente
// un socio vinculado al empleado que crea el capital — el panel normal de
// Capital (Capital.jsx) sigue mandando siempre un socioId explícito.
const esquemaCrearCapital = z.object({
  nombre:     z.string().min(1, 'El nombre del capital es requerido').max(150),
  valorTotal: z.number().positive('El valor del capital debe ser mayor a 0'),
  socioId:    z.string().uuid('Socio inválido').optional().or(z.literal('')),
})

const esquemaSuspenderCapital = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
})

// nombreContraparte se normaliza a Título (regla general de nombres de persona en formularios).
const esquemaAjustarCapital = z.object({
  tipo:              z.enum(['AGREGAR', 'QUITAR'], { errorMap: () => ({ message: 'Tipo de ajuste inválido' }) }),
  monto:             z.number().positive('El monto debe ser mayor a 0'),
  nombreContraparte: esquemaNombrePersona('El nombre es requerido', 150),
})

const validarCrearCapital = crearValidador(esquemaCrearCapital)
const validarSuspenderCapital = crearValidador(esquemaSuspenderCapital)
const validarAjustarCapital = crearValidador(esquemaAjustarCapital)

module.exports = { validarCrearCapital, validarSuspenderCapital, validarAjustarCapital }
