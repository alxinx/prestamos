'use strict'

const prisma = require('../../lib/prisma')
const { extraerContraparte } = require('../../lib/contraparteMovimiento')

// Cada tipo de documento verificable tiene su propia columna tokenVerificacion
// @unique (ninguna se comparte) y su propio bloque de búsqueda abajo. Se intentan
// en orden hasta encontrar coincidencia; ninguno filtra por tenantId — el token en
// sí (32 bytes aleatorios) ya identifica el registro exacto sin ambigüedad, y quien
// escanea el QR no tiene ni debe tener contexto de tenant (ver §3 CLAUDE.md: la
// excepción ya establecida para /api/activar).

// Solo un cierre APROBADO es "el registro oficial" contra el que se compara el
// voucher impreso — uno PENDIENTE o RECHAZADO no tiene aprobadoPor/horaAprobacion
// definitivos todavía.
async function buscarCierreCajaIndividual(token) {
  const cierre = await prisma.cierreCajaIndividual.findFirst({
    where: { tokenVerificacion: token, estado: 'APROBADO' },
    select: {
      fecha: true,
      totalSegunSistema: true,
      totalEntregadoCobrador: true,
      diferencia: true,
      fechaAprobacion: true,
      cobrador: { select: { nombreCompleto: true } },
      aprobadoPor: { select: { nombreCompleto: true } },
    },
  })
  if (!cierre) return null

  return {
    valido: true,
    tipoDocumento: 'CIERRE_CAJA_INDIVIDUAL',
    datos: {
      fecha: cierre.fecha.toISOString().slice(0, 10),
      cobrador: cierre.cobrador.nombreCompleto,
      totalSegunSistema: cierre.totalSegunSistema.toNumber(),
      totalEntregado: cierre.totalEntregadoCobrador.toNumber(),
      diferencia: cierre.diferencia.toNumber(),
      aprobadoPor: cierre.aprobadoPor?.nombreCompleto ?? null,
      horaAprobacion: cierre.fechaAprobacion ? cierre.fechaAprobacion.toISOString().slice(11, 16) : null,
    },
  }
}

// Voucher de agregar/quitar capital (ajustarCapital). Un MovimientoCaja es
// inmutable desde que se crea — a diferencia del cierre, no hay un estado
// "pendiente" que filtrar: si el token existe, el movimiento ya es definitivo.
async function buscarAjusteCapital(token) {
  const movimiento = await prisma.movimientoCaja.findFirst({
    where: { tokenVerificacion: token, tipo: { in: ['APORTE', 'RETIRO'] } },
    select: {
      tipo: true,
      monto: true,
      saldoDespuesMovimiento: true,
      fecha: true,
      observaciones: true,
      registradoPor: { select: { nombreCompleto: true } },
      caja: { select: { nombre: true } },
    },
  })
  if (!movimiento) return null

  const entrada = movimiento.tipo === 'APORTE'
  const valorNuevo = movimiento.saldoDespuesMovimiento
  const valorAnterior = entrada
    ? valorNuevo.minus(movimiento.monto)
    : valorNuevo.plus(movimiento.monto)

  return {
    valido: true,
    tipoDocumento: 'AJUSTE_CAPITAL',
    datos: {
      fecha: movimiento.fecha.toISOString(),
      tipo: entrada ? 'AGREGAR' : 'QUITAR',
      capital: movimiento.caja.nombre,
      valorAnterior: valorAnterior.toNumber(),
      valorNuevo: valorNuevo.toNumber(),
      monto: movimiento.monto.toNumber(),
      autorizadoPor: movimiento.registradoPor.nombreCompleto,
      contraparte: extraerContraparte(movimiento.observaciones),
    },
  }
}

async function verificarDocumento(token) {
  try {
    const encontrado = (await buscarCierreCajaIndividual(token)) ?? (await buscarAjusteCapital(token))
    if (!encontrado) return { error: 'Documento no encontrado', status: 404 }

    return { ...encontrado, verificadoEn: new Date().toISOString() }
  } catch (err) {
    // Nunca se propaga: un error de DB no debe traducirse en un 500 ni en un stack
    // trace expuesto en el endpoint público más sensible del sistema.
    console.error('[Verificación] Error interno:', err.message)
    return { error: 'Documento no encontrado', status: 404 }
  }
}

module.exports = { verificarDocumento }
