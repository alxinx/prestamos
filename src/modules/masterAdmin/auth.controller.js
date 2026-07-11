'use strict'

const { iniciarSesion, renovarToken, cerrarSesion, cambiarPassword } = require('./auth.service')
const { crearManejadoresSesion } = require('../../lib/controladorAuth')

const { manejarLogin, manejarRefresh, manejarLogout } = crearManejadoresSesion({
  iniciarSesion, renovarToken, cerrarSesion, cookieAccess: 'ma_access',
})

async function manejarCambioPassword(req, res, next) {
  try {
    const resultado = await cambiarPassword(req)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (err) { next(err) }
}

module.exports = { manejarLogin, manejarRefresh, manejarLogout, manejarCambioPassword }
