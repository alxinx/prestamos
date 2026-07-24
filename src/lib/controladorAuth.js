'use strict'

// `secure` se deriva de NODE_ENV por defecto (CLAUDE.md §6: "secure: true en
// producción") — nunca depende únicamente de que alguien recuerde setear
// COOKIE_SECURE=true en el .env de producción. COOKIE_SECURE sigue existiendo
// como override explícito para casos raros (ej. staging detrás de un proxy
// TLS con NODE_ENV=development), pero el valor seguro es el que se aplica solo
// si production ya no lo exige.
const BASE_COOKIE = {
  httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
  secure:   process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'strict',
}

const opcionesRefresh = { ...BASE_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 }
const opcionesAccess  = { ...BASE_COOKIE, maxAge: 15 * 60 * 1000 }

// Factoriza los 3 manejadores idénticos entre masterAdmin/auth y tenant/auth:
// login, refresh y logout solo difieren en el servicio invocado y el nombre
// de la cookie de access token.
function crearManejadoresSesion({ iniciarSesion, renovarToken, cerrarSesion, cookieAccess }) {
  function emitirCookies(res, resultado) {
    res.cookie(resultado.nombreCookie, resultado.refreshToken, opcionesRefresh)
    res.cookie(cookieAccess, resultado.accessToken, opcionesAccess)
  }

  async function manejarLogin(req, res, next) {
    try {
      const resultado = await iniciarSesion(req)
      if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
      emitirCookies(res, resultado)
      res.json({ ok: true })
    } catch (err) { next(err) }
  }

  async function manejarRefresh(req, res, next) {
    try {
      const resultado = await renovarToken(req)
      if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
      emitirCookies(res, resultado)
      res.json({ ok: true })
    } catch (err) { next(err) }
  }

  async function manejarLogout(req, res, next) {
    try {
      const resultado = await cerrarSesion(req)
      res.clearCookie(resultado.nombreCookie, BASE_COOKIE)
      res.clearCookie(cookieAccess, BASE_COOKIE)
      res.json({ mensaje: 'Sesión cerrada' })
    } catch (err) { next(err) }
  }

  return { manejarLogin, manejarRefresh, manejarLogout }
}

module.exports = { crearManejadoresSesion }
