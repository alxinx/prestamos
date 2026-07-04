'use strict'

const { iniciarSesion, renovarToken, cerrarSesion, solicitarRecuperacion, restablecerContrasena } = require('./auth.service')

const opcionesCookie = {
  httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
  secure:   process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
}

async function manejarLogin(req, res, next) {
  try {
    const resultado = await iniciarSesion(req)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.cookie(resultado.nombreCookie, resultado.refreshToken, opcionesCookie)
    res.json({ accessToken: resultado.accessToken })
  } catch (err) { next(err) }
}

async function manejarRefresh(req, res, next) {
  try {
    const resultado = await renovarToken(req)
    if (resultado.error) return res.status(resultado.status).json({ error: resultado.error })
    res.cookie(resultado.nombreCookie, resultado.refreshToken, opcionesCookie)
    res.json({ accessToken: resultado.accessToken })
  } catch (err) { next(err) }
}

async function manejarLogout(req, res, next) {
  try {
    const resultado = await cerrarSesion(req)
    res.clearCookie(resultado.nombreCookie, opcionesCookie)
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
