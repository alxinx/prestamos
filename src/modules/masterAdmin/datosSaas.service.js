'use strict'

const prisma = require('../../lib/prisma')

const ID_SINGLETON = 'singleton'

async function obtenerDatosSaas() {
  const datos = await prisma.datosSaas.findUnique({ where: { id: ID_SINGLETON } })
  return { datos }
}

async function guardarDatosSaas(datos) {
  const registro = await prisma.datosSaas.upsert({
    where: { id: ID_SINGLETON },
    update: {
      nombreRazonSocial: datos.nombreRazonSocial,
      nit:               datos.nit,
      email:             datos.email,
    },
    create: {
      id:                ID_SINGLETON,
      nombreRazonSocial: datos.nombreRazonSocial,
      nit:               datos.nit,
      email:             datos.email,
    },
  })
  return { datos: registro }
}

module.exports = { obtenerDatosSaas, guardarDatosSaas }
