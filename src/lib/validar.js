'use strict'

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

module.exports = { crearValidador }
