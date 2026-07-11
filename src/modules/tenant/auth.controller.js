'use strict'

const { iniciarSesion, renovarToken, cerrarSesion, solicitarRecuperacion, restablecerContrasena, obtenerPerfil } = require('./auth.service')
const { obtenerMisPermisos } = require('./permisos/permisos.service')
const { crearManejadoresSesion } = require('../../lib/controladorAuth')
const { registrarConexion, eliminarConexion } = require('../../lib/eventosEmpleado')

const { manejarLogin, manejarRefresh, manejarLogout } = crearManejadoresSesion({
  iniciarSesion, renovarToken, cerrarSesion, cookieAccess: 't_access',
})

async function manejarSolicitarRecuperacion(req, res, next) {
  try {
    const resultado = await solicitarRecuperacion(req.body)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function manejarRestablecerContrasena(req, res, next) {
  try {
    const resultado = await restablecerContrasena(req.body)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function manejarMe(req, res, next) {
  try {
    const resultado = await obtenerPerfil(req)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.json(resultado)
  } catch (err) { next(err) }
}

async function manejarMisPermisos(req, res, next) {
  try {
    const resultado = await obtenerMisPermisos(req)
    res.json(resultado)
  } catch (err) { next(err) }
}

// SSE: avisa en tiempo real de eventos relevantes para este empleado —
// "permisos-actualizados" (cambio de permisos o de rol) y "cuenta-desactivada"
// (el administrador lo desactivó) — sin tener que hacer polling. La conexión se
// mantiene abierta indefinidamente y no devuelve JSON como el resto de rutas.
function manejarEventosEmpleado(req, res) {
  const { id: empleadoId } = req.empleado

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write(': conectado\n\n')

  registrarConexion(empleadoId, res)

  const latido = setInterval(() => res.write(': ping\n\n'), 25000)

  req.on('close', () => {
    clearInterval(latido)
    eliminarConexion(empleadoId, res)
  })
}

module.exports = { manejarLogin, manejarRefresh, manejarLogout, manejarSolicitarRecuperacion, manejarRestablecerContrasena, manejarMe, manejarMisPermisos, manejarEventosEmpleado }
