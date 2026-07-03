'use strict'

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')

const prisma = new PrismaClient()

const planes = [
  {
    nombre: 'Básico',
    precio: 80000,
    limitePrestamos: 150,
    limiteCobradores: 5,
    limiteMensajesWsp: 500,
    consultasScore: 0,
    tieneBot: false,
    tienePortalCliente: false,
    tieneFirmaDigital: false,
    precioPréstamoAdicional: 0,
    estado: 'ACTIVO',
  },
  {
    nombre: 'Pro',
    precio: 180000,
    limitePrestamos: 600,
    limiteCobradores: 20,
    limiteMensajesWsp: 3000,
    consultasScore: 300,
    tieneBot: true,
    tienePortalCliente: true,
    tieneFirmaDigital: false,
    precioPréstamoAdicional: 0,
    estado: 'ACTIVO',
  },
  {
    nombre: 'Enterprise',
    precio: 350000,
    limitePrestamos: -1,
    limiteCobradores: -1,
    limiteMensajesWsp: -1,
    consultasScore: -1,
    tieneBot: true,
    tienePortalCliente: true,
    tieneFirmaDigital: true,
    precioPréstamoAdicional: 0,
    estado: 'ACTIVO',
  },
]

async function seedPlanes() {
  for (const plan of planes) {
    const existe = await prisma.plan.findFirst({ where: { nombre: plan.nombre } })
    if (existe) {
      console.log(`[Seed] Plan ya existe: ${plan.nombre}`)
      continue
    }
    await prisma.plan.create({ data: { id: uuidv7(), ...plan } })
    console.log(`[Seed] Plan creado: ${plan.nombre}`)
  }
}

async function main() {
  const email = process.env.MASTER_ADMIN_EMAIL
  const password = process.env.MASTER_ADMIN_PASSWORD
  const ipWhitelist = JSON.parse(process.env.MASTER_ADMIN_IP_WHITELIST || '["127.0.0.1"]')
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12

  if (!email || !password) {
    throw new Error('MASTER_ADMIN_EMAIL y MASTER_ADMIN_PASSWORD son requeridos en .env')
  }

  const existing = await prisma.masterAdmin.findUnique({ where: { email } })
  if (existing) {
    console.log(`[Seed] Master admin ya existe: ${email}`)
  } else {
    const passwordHash = await bcrypt.hash(password, rounds)
    await prisma.masterAdmin.create({
      data: {
        id: uuidv7(),
        email,
        passwordHash,
        dosFASecreto: '',
        ipWhitelist,
      },
    })
    console.log(`[Seed] Master admin creado: ${email}`)
  }

  await seedPlanes()
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
