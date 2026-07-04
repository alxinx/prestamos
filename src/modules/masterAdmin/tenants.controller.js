'use strict'

const { estadisticasTenants, listarTenants, crearTenant, actualizarTenant, obtenerTenant, reenviarActivacion, eliminarUltimoTenant, verificarEmailDisponible } = require('./tenants.service')
const { controlar } = require('../../lib/controlador')

const manejarEstadisticas = controlar(() => estadisticasTenants())

const manejarListar = controlar(req => {
  const { busqueda = '', pagina = '1', porPagina = '10' } = req.query
  return listarTenants({
    busqueda,
    pagina: Math.max(1, parseInt(pagina, 10)),
    porPagina: Math.min(50, Math.max(1, parseInt(porPagina, 10))),
  })
})

const manejarObtener           = controlar(req => obtenerTenant(req.params.id))
const manejarCrear             = controlar(req => crearTenant(req.body), { crear: true })
const manejarActualizar        = controlar(req => actualizarTenant(req.params.id, req.body))
const manejarReenviarActivacion = controlar(req => reenviarActivacion(req.params.id))

const manejarVerificarEmail = controlar(req => {
  const { email, excluirId } = req.query
  if (!email) return { error: 'Email requerido', status: 422 }
  return verificarEmailDisponible(email, excluirId || null)
})

const manejarEliminarUltimo = controlar(req => {
  if (process.env.NODE_ENV === 'production') return { error: 'Ruta no encontrada', status: 404 }
  return eliminarUltimoTenant()
})

module.exports = { manejarEstadisticas, manejarListar, manejarObtener, manejarCrear, manejarActualizar, manejarReenviarActivacion, manejarEliminarUltimo, manejarVerificarEmail }
