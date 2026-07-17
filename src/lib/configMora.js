'use strict'

const prisma = require('./prisma')

// Resuelve la configuración de interés por mora efectiva de un crédito: prioridad
// a lo definido en su PlantillaCredito; si la plantilla no activó mora propia,
// cae al default general del tenant en ConfiguracionOperativa (decisión
// 2026-07-16). ConfiguracionOperativa solo modela un % diario y días de gracia
// (sin "base de cálculo" propia) — en el fallback la base siempre es CAPITAL,
// la única que tiene sentido sin un interés causado por plantilla de referencia.
//
// NOTA: hoy ConfiguracionOperativa no tiene UI/CRUD (Configuración sigue siendo
// un placeholder), así que ningún tenant tiene todavía una fila real acá y el
// fallback devuelve activo:false. Esta función queda lista para cuando se
// construya esa pantalla y el motor real que cobra la mora — hoy nada la llama.
async function resolverConfigMora(tenantId, plantilla) {
  if (plantilla.interesMoraActivo) {
    return {
      activo: true,
      porcentaje: plantilla.porcentajeMora,
      base: plantilla.baseCalculoMora,
      diasGracia: plantilla.diasGraciaMora,
      origen: 'plantilla',
    }
  }

  const config = await prisma.configuracionOperativa.findUnique({ where: { tenantId } })
  if (!config) return { activo: false, origen: null }

  return {
    activo: true,
    porcentaje: config.porcentajeMoraDiario,
    base: 'CAPITAL',
    diasGracia: config.diasGraciaMora,
    origen: 'tenant',
  }
}

module.exports = { resolverConfigMora }
