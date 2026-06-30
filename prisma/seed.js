'use strict'

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')

const prisma = new PrismaClient()

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
    return
  }

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

main()
  .catch((e) => {
    console.error('[Seed] Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
