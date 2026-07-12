'use strict'

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { generarTokenVerificacion } = require('../src/lib/tokenVerificacion')

const prisma = new PrismaClient()

// Backfill único: genera tokenVerificacion para los movimientos de aporte/retiro
// (agregar/quitar capital) creados antes de que existiera el QR de verificación.
// Solo llena la columna nueva — no toca monto/saldo/fecha/observaciones de ningún
// registro (los movimientos financieros son inmutables, CLAUDE.md §4). Cada fila
// necesita un token distinto (columna @unique), por eso se actualiza una por una
// en vez de un UPDATE masivo con el mismo valor.
async function backfill() {
  const pendientes = await prisma.movimientoCaja.findMany({
    where: { tipo: { in: ['APORTE', 'RETIRO'] }, tokenVerificacion: null },
    select: { id: true },
  })

  console.log(`[Backfill] ${pendientes.length} movimientos sin token.`)

  let actualizados = 0
  for (const { id } of pendientes) {
    await prisma.movimientoCaja.update({
      where: { id },
      data: { tokenVerificacion: generarTokenVerificacion() },
    })
    actualizados++
  }

  console.log(`[Backfill] ${actualizados} movimientos actualizados.`)
}

backfill()
  .catch(err => {
    console.error('[Backfill] Error:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
