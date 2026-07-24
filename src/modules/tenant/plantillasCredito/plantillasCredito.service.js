'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { ESTADOS_CREDITO_MORA } = require('../../../lib/creditosConstantes')

async function listarPlantillas(req) {
  const { tenantId } = req.empleado
  const plantillas = await prisma.plantillaCredito.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
  return { plantillas }
}

async function crearPlantilla(req) {
  const { tenantId, id: autorId } = req.empleado
  const {
    nombre, plazo, tasaInteres, numeroCuotas, frecuenciaPago, montoMinimo, montoMaximo,
    interesMoraActivo, porcentajeMora, baseCalculoMora, diasGraciaMora,
  } = req.body

  const id = uuidv7()
  const plantilla = await prisma.plantillaCredito.create({
    data: {
      id, tenantId, nombre, plazo, tasaInteres, numeroCuotas, frecuenciaPago, montoMinimo, montoMaximo,
      estado: 'ACTIVA',
      interesMoraActivo,
      // Si el interés por mora no está activo, ni el % ni la base de cálculo
      // aplican — se guarda null en vez de lo que traiga el body (ya validado
      // como opcional en ese caso).
      porcentajeMora: interesMoraActivo ? porcentajeMora : null,
      baseCalculoMora: interesMoraActivo ? baseCalculoMora : null,
      diasGraciaMora,
    },
  })

  // AuditLog.valorNuevo es Json — nunca guardar instancias de Prisma.Decimal ahí
  // directamente, se convierten a Number primero (mismo criterio que capital.service.js).
  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CREAR_PLANTILLA_CREDITO',
    entidadTipo: 'PlantillaCredito',
    entidadId: id,
    valorNuevo: {
      nombre, plazo, numeroCuotas, frecuenciaPago,
      tasaInteres: plantilla.tasaInteres.toNumber(),
      montoMinimo: plantilla.montoMinimo.toNumber(),
      montoMaximo: plantilla.montoMaximo.toNumber(),
      interesMoraActivo: plantilla.interesMoraActivo,
      porcentajeMora: plantilla.porcentajeMora ? plantilla.porcentajeMora.toNumber() : null,
      baseCalculoMora: plantilla.baseCalculoMora,
      diasGraciaMora: plantilla.diasGraciaMora,
    },
  })

  return plantilla
}

// PUT /plantillas-credito/:id — edita las condiciones de una plantilla ya
// creada. No toca `estado` (eso es cambiarEstadoPlantilla, una acción
// separada) ni afecta créditos ya otorgados con esta plantilla: montoInicial,
// tasaInteres, numeroCuotas, etc. quedan copiados en el propio Credito al
// otorgarse (CLAUDE.md §4 — nunca se recalculan desde la plantilla después).
// La configuración de mora (porcentajeMora/diasGraciaMora/interesMoraActivo)
// sí se resuelve en vivo contra la plantilla en cada cálculo, así que
// editarla acá cambia la mora de los créditos activos que la usan — es el
// comportamiento esperado de una pantalla de "condiciones".
async function editarPlantilla(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const {
    nombre, plazo, tasaInteres, numeroCuotas, frecuenciaPago, montoMinimo, montoMaximo,
    interesMoraActivo, porcentajeMora, baseCalculoMora, diasGraciaMora,
  } = req.body

  const anterior = await prisma.plantillaCredito.findFirst({ where: { id, tenantId } })
  if (!anterior) return { error: 'Plantilla no encontrada', status: 404 }

  const plantilla = await prisma.plantillaCredito.update({
    where: { id },
    data: {
      nombre, plazo, tasaInteres, numeroCuotas, frecuenciaPago, montoMinimo, montoMaximo,
      interesMoraActivo,
      porcentajeMora: interesMoraActivo ? porcentajeMora : null,
      baseCalculoMora: interesMoraActivo ? baseCalculoMora : null,
      diasGraciaMora,
    },
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'EDITAR_PLANTILLA_CREDITO',
    entidadTipo: 'PlantillaCredito',
    entidadId: id,
    valorAnterior: {
      nombre: anterior.nombre, plazo: anterior.plazo, numeroCuotas: anterior.numeroCuotas, frecuenciaPago: anterior.frecuenciaPago,
      tasaInteres: anterior.tasaInteres.toNumber(),
      montoMinimo: anterior.montoMinimo.toNumber(),
      montoMaximo: anterior.montoMaximo.toNumber(),
      interesMoraActivo: anterior.interesMoraActivo,
      porcentajeMora: anterior.porcentajeMora ? anterior.porcentajeMora.toNumber() : null,
      baseCalculoMora: anterior.baseCalculoMora,
      diasGraciaMora: anterior.diasGraciaMora,
    },
    valorNuevo: {
      nombre, plazo, numeroCuotas, frecuenciaPago,
      tasaInteres: plantilla.tasaInteres.toNumber(),
      montoMinimo: plantilla.montoMinimo.toNumber(),
      montoMaximo: plantilla.montoMaximo.toNumber(),
      interesMoraActivo: plantilla.interesMoraActivo,
      porcentajeMora: plantilla.porcentajeMora ? plantilla.porcentajeMora.toNumber() : null,
      baseCalculoMora: plantilla.baseCalculoMora,
      diasGraciaMora: plantilla.diasGraciaMora,
    },
  })

  return plantilla
}

// PATCH /plantillas-credito/:id/estado — suspende ("INACTIVA") o reactiva
// ("ACTIVA") una plantilla. Una plantilla INACTIVA simplemente deja de
// ofrecerse para NUEVOS préstamos (el wizard de creación filtra por
// estado:'ACTIVA') — no afecta los créditos que ya se otorgaron con ella.
async function cambiarEstadoPlantilla(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const { estado } = req.body

  const anterior = await prisma.plantillaCredito.findFirst({ where: { id, tenantId } })
  if (!anterior) return { error: 'Plantilla no encontrada', status: 404 }
  if (anterior.estado === estado) return anterior

  const plantilla = await prisma.plantillaCredito.update({ where: { id }, data: { estado } })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'CAMBIAR_ESTADO_PLANTILLA_CREDITO',
    entidadTipo: 'PlantillaCredito',
    entidadId: id,
    valorAnterior: { estado: anterior.estado },
    valorNuevo: { estado: plantilla.estado },
  })

  return plantilla
}

// Stat: % de créditos en mora por plantilla, para identificar cuáles plantillas
// tienden a producir más cartera en mora. Solo incluye plantillas con al menos
// un crédito otorgado — una plantilla nueva sin uso no aporta señal ("0 de 0").
async function moraPorPlantilla(req) {
  const { tenantId } = req.empleado

  const [plantillas, totalPorPlantilla, moraPorPlantillaResultado] = await Promise.all([
    prisma.plantillaCredito.findMany({ where: { tenantId }, select: { id: true, nombre: true } }),
    prisma.credito.groupBy({
      by: ['plantillaId'],
      where: { tenantId, plantillaId: { not: null } },
      _count: { id: true },
    }),
    prisma.credito.groupBy({
      by: ['plantillaId'],
      where: { tenantId, plantillaId: { not: null }, estado: { in: ESTADOS_CREDITO_MORA } },
      _count: { id: true },
    }),
  ])

  const totalPorId = new Map(totalPorPlantilla.map(t => [t.plantillaId, t._count.id]))
  const moraPorId = new Map(moraPorPlantillaResultado.map(m => [m.plantillaId, m._count.id]))

  const resultado = plantillas
    .map(p => {
      const totalCreditos = totalPorId.get(p.id) ?? 0
      const creditosEnMora = moraPorId.get(p.id) ?? 0
      return {
        id: p.id,
        nombre: p.nombre,
        totalCreditos,
        creditosEnMora,
        porcentajeMora: totalCreditos > 0 ? Number(((creditosEnMora / totalCreditos) * 100).toFixed(1)) : 0,
      }
    })
    .filter(p => p.totalCreditos > 0)
    .sort((a, b) => b.porcentajeMora - a.porcentajeMora)

  return { plantillas: resultado }
}

module.exports = { listarPlantillas, crearPlantilla, editarPlantilla, cambiarEstadoPlantilla, moraPorPlantilla }
