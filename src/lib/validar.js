'use strict'

const { z } = require('zod')

function crearValidador(esquema) {
  return function (req, res, next) {
    const resultado = esquema.safeParse(req.body)
    if (!resultado.success) {
      return res.status(422).json({ error: resultado.error.errors[0].message })
    }
    req.body = resultado.data
    next()
  }
}

// Regla mínima de contraseña compartida por todos los flujos de login/activación/
// recuperación (tenant, master-admin, colaboradores) — igual a lib/validacionContrasena.js del frontend.
const esquemaContrasena = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')

// Normaliza texto de nombre propio a Título — "alejandro gonzalez" -> "Alejandro
// Gonzalez". Pasa primero todo a minúsculas para no duplicar mayúsculas si el
// usuario escribió en mayúsculas sostenidas (ej. "ALEJANDRO GONZALEZ").
// Uso: SOLO para nombres de persona (nombreCompleto, cargo) — nunca para nombres
// comerciales o razón social, que pueden llevar mayúsculas o siglas intencionales
// (ej. "S.A.S.") que este transform rompería.
function normalizarTitulo(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(palabra => palabra ? palabra[0].toUpperCase() + palabra.slice(1) : palabra)
    .join(' ')
}

// Zod schema helper para campos de nombre de persona — string requerido +
// normalizado a Título. Ver `normalizarTitulo` para el alcance permitido.
function esquemaNombrePersona(mensajeRequerido = 'Este campo es requerido', max = 150, min = 1) {
  return z.string().min(min, mensajeRequerido).max(max).transform(normalizarTitulo)
}

module.exports = { crearValidador, esquemaContrasena, normalizarTitulo, esquemaNombrePersona }
