'use strict'

const prisma = require('./prisma')
const { ESTADOS_CREDITO_ACTIVOS } = require('./creditosConstantes')

// Núcleo compartido: cuenta el uso actual de un recurso y lo compara contra el
// límite del plan del tenant — el límite se lee siempre del plan actual en BD,
// nunca del JWT (el tenant puede cambiar de plan sin volver a iniciar sesión).
// -1 significa ilimitado (misma convención que planes.validator.js en
// master-admin). `contarUsados` recibe el tenantId y hace el count específico
// de cada recurso; `campoLimite` es el campo de Plan contra el que se compara.
async function obtenerUsoLimite(tenantId, { contarUsados, campoLimite }) {
  const [usados, tenant] = await Promise.all([
    contarUsados(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: { select: { [campoLimite]: true } } } }),
  ])

  const limite = tenant.plan[campoLimite]
  return { usados, limite, alcanzado: limite !== -1 && usados >= limite }
}

// "¿Cuántos préstamos activos tiene el tenant vs. cuántos le permite su plan?"
function obtenerUsoLimitePrestamos(tenantId) {
  return obtenerUsoLimite(tenantId, {
    contarUsados: id => prisma.credito.count({ where: { tenantId: id, estado: { in: ESTADOS_CREDITO_ACTIVOS } } }),
    campoLimite: 'limitePrestamos',
  })
}

// Forma estándar del error 403 cuando `alcanzado` es true — usado por
// crearCredito y crearColaborador para no repetir el mismo objeto de error.
function errorLimiteAlcanzado(nombreRecurso) {
  return {
    error: `Alcanzaste el límite de ${nombreRecurso} de tu plan. Mejora tu plan o comunícate con servicio al cliente para ampliar tu cupo.`,
    status: 403,
  }
}

// "¿Cuántos colaboradores tiene el tenant vs. cuántos le permite su plan?"
// Cuenta solo empleados ACTIVO (decisión 2026-07-18) — INACTIVO, SUSPENDIDO y
// RETIRADO no ocupan cupo, cuentan como si no existieran. Así, desactivar un
// colaborador libera el cupo de inmediato para contratar a otro. Tampoco
// cuenta al super admin (dueño de la cuenta, no un cupo comprado).
function obtenerUsoLimiteColaboradores(tenantId) {
  return obtenerUsoLimite(tenantId, {
    contarUsados: id => prisma.empleado.count({ where: { tenantId: id, esSuperAdmin: false, estado: 'ACTIVO' } }),
    campoLimite: 'limiteColaboradores',
  })
}

module.exports = { obtenerUsoLimitePrestamos, obtenerUsoLimiteColaboradores, errorLimiteAlcanzado }
