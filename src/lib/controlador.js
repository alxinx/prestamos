'use strict'

function controlar(fn, { crear = false } = {}) {
  return async (req, res, next) => {
    try {
      const resultado = await fn(req)
      if (resultado?.error) return res.status(resultado.status).json({ error: resultado.error })
      res.status(crear ? 201 : 200).json(resultado)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = { controlar }
