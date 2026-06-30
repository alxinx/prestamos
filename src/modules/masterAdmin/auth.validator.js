'use strict'

const { z } = require('zod')

const esquemaLogin = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida'),
})

function validarLogin(req, res, next) {
  const resultado = esquemaLogin.safeParse(req.body)
  if (!resultado.success) {
    return res.status(422).json({ error: resultado.error.errors[0].message })
  }
  req.body = resultado.data
  next()
}

module.exports = { validarLogin }
