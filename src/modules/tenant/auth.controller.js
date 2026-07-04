'use strict'

const { iniciarSesion, renovarToken, cerrarSesion, solicitarRecuperacion, restablecerContrasena } = require('./auth.service')

const BASE_COOKIE = {
  httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
  secure:   process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'strict',
}

const opcionesRefresh = { ...BASE_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 }
const opcionesAccess  = { ...BASE_COOKIE, maxAge: 15 * 60 * 1000 }

const COOKIE_ACCESS = 't_access'

function emitirCookies(res, resultado) {
  res.cookie(resultado.nombreCookie, resultado.refreshToken, opcionesRefresh)
  res.cookie(COOKIE_ACCESS, resultado.accessToken, opcionesAccess)
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
    res.clearCookie(COOKIE_ACCESS, BASE_COOKIE)
    res.json({ mensaje: 'Sesión cerrada' })
  } catch (err) { next(err) }
}

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

module.exports = { manejarLogin, manejarRefresh, manejarLogout, manejarSolicitarRecuperacion, manejarRestablecerContrasena }
