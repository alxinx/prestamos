'use strict'

const { redis } = require('./redis')

// Bus de eventos en tiempo real hacia un empleado conectado (SSE), reutilizado
// tanto para "permisos actualizados" como para "cuenta desactivada" — evita
// duplicar el registro de conexiones y el suscriptor Redis por cada tipo de evento.
//
// Registro en memoria (no persistido) de conexiones SSE activas por empleado —
// un Map de empleadoId a un Set de `res` de Express. Permite varias pestañas o
// dispositivos por empleado sin abrir una conexión a Redis por cada una: solo
// hay UN suscriptor Redis para todo el proceso (ver más abajo), lo que mantiene
// el consumo de memoria mínimo sin importar cuántos empleados estén conectados.
const conexionesPorEmpleado = new Map()

function registrarConexion(empleadoId, res) {
  if (!conexionesPorEmpleado.has(empleadoId)) conexionesPorEmpleado.set(empleadoId, new Set())
  conexionesPorEmpleado.get(empleadoId).add(res)
}

function eliminarConexion(empleadoId, res) {
  const conexiones = conexionesPorEmpleado.get(empleadoId)
  if (!conexiones) return
  conexiones.delete(res)
  if (conexiones.size === 0) conexionesPorEmpleado.delete(empleadoId)
}

function notificarLocal(empleadoId, evento) {
  const conexiones = conexionesPorEmpleado.get(empleadoId)
  if (!conexiones) return
  for (const res of conexiones) res.write(`event: ${evento}\ndata: {}\n\n`)
}

// Un único cliente Redis en modo suscripción para todo el proceso — un cliente
// normal no puede ejecutar otros comandos mientras está suscrito, por eso se usa
// `duplicate()`. Publicar en el canal `empleado-eventos:{empleadoId}` (desde este
// proceso o desde otro, si algún día se escala horizontalmente) llega aquí y se
// reenvía solo a las conexiones SSE que ESTE proceso tiene abiertas para ese empleado.
const PREFIJO_CANAL = 'empleado-eventos:'
const suscriptor = redis.duplicate()
suscriptor.psubscribe(`${PREFIJO_CANAL}*`).catch(err => console.error('[EventosEmpleado] Error al suscribirse:', err.message))
suscriptor.on('pmessage', (_patron, canal, evento) => {
  notificarLocal(canal.slice(PREFIJO_CANAL.length), evento)
})

function publicarEventoEmpleado(empleadoId, evento) {
  redis.publish(`${PREFIJO_CANAL}${empleadoId}`, evento).catch(err => console.error('[EventosEmpleado] Error al publicar:', err.message))
}

// Wrappers con el nombre de evento fijo — evitan repetir el string mágico en cada call site.
const publicarCambioPermisos    = empleadoId => publicarEventoEmpleado(empleadoId, 'permisos-actualizados')
const publicarCuentaDesactivada = empleadoId => publicarEventoEmpleado(empleadoId, 'cuenta-desactivada')

module.exports = { registrarConexion, eliminarConexion, publicarCambioPermisos, publicarCuentaDesactivada }
