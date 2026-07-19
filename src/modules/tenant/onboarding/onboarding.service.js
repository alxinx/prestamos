'use strict'

const prisma = require('../../../lib/prisma')

// Estado en vivo (nunca el flag persistido) — lo usa el wizard para saber en
// qué paso reanudar si el admin refresca la página a mitad de camino. `caja`
// cuenta cualquier estado (ACTIVA/SUSPENDIDA): lo que importa acá es que el
// paso ya se completó alguna vez, no si sigue operable hoy.
async function estadoOnboarding(req) {
  const { tenantId } = req.empleado

  const [tieneCapital, tieneCobrador] = await Promise.all([
    prisma.caja.count({ where: { tenantId } }).then(n => n > 0),
    prisma.empleado.count({ where: { tenantId, rol: { nombre: 'COBRADOR' } } }).then(n => n > 0),
  ])

  return { tieneCapital, tieneCobrador }
}

// Marca el wizard como completado — nunca confía en lo que el frontend cree
// que ya hizo, revalida en vivo (mismos counts que estadoOnboarding) antes de
// tocar el flag. Tenant.onboardingCompletado nunca vuelve a false una vez en
// true (ver comentario en schema.prisma) — acá solo se escribe si es false.
async function finalizarOnboarding(req) {
  const { tenantId } = req.empleado

  const { tieneCapital, tieneCobrador } = await estadoOnboarding(req)
  if (!tieneCapital || !tieneCobrador) {
    const faltantes = [!tieneCapital && 'un capital', !tieneCobrador && 'un cobrador'].filter(Boolean)
    return { error: `Todavía falta crear ${faltantes.join(' y ')}.`, status: 422 }
  }

  await prisma.tenant.update({ where: { id: tenantId }, data: { onboardingCompletado: true } })

  return { ok: true }
}

module.exports = { estadoOnboarding, finalizarOnboarding }
