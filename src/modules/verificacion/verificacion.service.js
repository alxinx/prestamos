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

// Letra de cambio impresa desde un crédito. `esEnBlanco`/`camposEnBlanco` viajan
// para que quien verifique sepa que esos datos pudieron diligenciarse a mano
// después de imprimirse (letra en blanco, Art. 622 C.Co.) — no se puede comparar
// el papel físico 1:1 contra el registro en esos campos.
async function buscarLetraCambio(token) {
  const letra = await prisma.letraCambio.findFirst({
    where: { tokenVerificacion: token },
    select: {
      deudorNombre: true,
      deudorCedula: true,
      incluyeValor: true,
      valor: true,
      incluyeBeneficiario: true,
      beneficiario: true,
      incluyeFecha: true,
      fechaVencimiento: true,
      esEnBlanco: true,
      createdAt: true,
      generadoPor: { select: { nombreCompleto: true } },
    },
  })
  if (!letra) return null

  return {
    valido: true,
    tipoDocumento: 'LETRA_CAMBIO',
    datos: {
      fecha: letra.createdAt.toISOString(),
      deudorNombre: letra.deudorNombre,
      deudorCedula: letra.deudorCedula,
      valor: letra.incluyeValor ? letra.valor.toNumber() : null,
      beneficiario: letra.incluyeBeneficiario ? letra.beneficiario : null,
      fechaVencimiento: letra.incluyeFecha ? letra.fechaVencimiento.toISOString().slice(0, 10) : null,
      esEnBlanco: letra.esEnBlanco,
      camposEnBlanco: [
        !letra.incluyeValor && 'valor',
        !letra.incluyeBeneficiario && 'beneficiario',
        !letra.incluyeFecha && 'fecha de vencimiento',
      ].filter(Boolean),
      generadoPor: letra.generadoPor.nombreCompleto,
    },
  }
}

// Resumen de préstamo (PDF + email enviados al otorgar el crédito, ver
// crearCredito en creditos.service.js). El token vive directo en `creditos`
// (no en una tabla aparte como LetraCambio) porque el resumen es 1:1 con el
// crédito — no hay "variantes" que generar más de una vez por crédito.
async function buscarResumenPrestamo(token) {
  const credito = await prisma.credito.findFirst({
    where: { tokenVerificacion: token },
    select: {
      montoInicial: true,
      tasaInteres: true,
      numeroCuotas: true,
      frecuenciaPago: true,
      fechaInicio: true,
      createdAt: true,
      cliente: { select: { clienteGlobal: { select: { nombreCompleto: true, cedula: true } } } },
      cobrador: { select: { nombreCompleto: true } },
    },
  })
  if (!credito) return null

  return {
    valido: true,
    tipoDocumento: 'RESUMEN_PRESTAMO',
    datos: {
      fecha: credito.createdAt.toISOString(),
      cliente: credito.cliente.clienteGlobal.nombreCompleto,
      clienteCedula: credito.cliente.clienteGlobal.cedula,
      cobrador: credito.cobrador.nombreCompleto,
      montoInicial: credito.montoInicial.toNumber(),
      tasaInteres: credito.tasaInteres.toNumber(),
      numeroCuotas: credito.numeroCuotas,
      frecuenciaPago: credito.frecuenciaPago,
    },
  }
}

// Voucher de un pago (pagos.service.js/registrarPago) — todo pago se aplica y
// se marca LIQUIDADO de inmediato al registrarse (decisión del usuario
// 2026-07-23, ya no hay paso de liquidación aparte), así que si el token
// existe el pago ya es un hecho consumado. Un mismo Pago puede repartirse
// entre varias cuotas (una fila de DistribucionPago por cuota tocada — motor
// de aplicación por cuota), por eso se suman todas sus filas en vez de leer
// solo la primera.
async function buscarPagoLiquidado(token) {
  const pago = await prisma.pago.findFirst({
    where: { tokenVerificacion: token, estado: 'LIQUIDADO' },
    select: {
      montoRecibido: true,
      metodoPago: true,
      tipo: true,
      fechaLiquidacion: true,
      credito: { select: { cliente: { select: { clienteGlobal: { select: { nombreCompleto: true, cedula: true } } } } } },
      liquidadoPor: { select: { nombreCompleto: true } },
      distribuciones: { select: { valorRecargos: true, valorIntereses: true, valorCapital: true, totalAplicado: true } },
    },
  })
  if (!pago) return null

  const totales = pago.distribuciones.reduce((acc, d) => ({
    valorRecargos: acc.valorRecargos + d.valorRecargos.toNumber(),
    valorIntereses: acc.valorIntereses + d.valorIntereses.toNumber(),
    valorCapital: acc.valorCapital + d.valorCapital.toNumber(),
  }), { valorRecargos: 0, valorIntereses: 0, valorCapital: 0 })

  return {
    valido: true,
    tipoDocumento: 'PAGO_LIQUIDADO',
    datos: {
      fecha: pago.fechaLiquidacion.toISOString(),
      cliente: pago.credito.cliente.clienteGlobal.nombreCompleto,
      clienteCedula: pago.credito.cliente.clienteGlobal.cedula,
      montoRecibido: pago.montoRecibido.toNumber(),
      metodoPago: pago.metodoPago,
      tipo: pago.tipo,
      ...totales,
      liquidadoPor: pago.liquidadoPor?.nombreCompleto ?? null,
    },
  }
}

async function verificarDocumento(token) {
  try {
    const encontrado = (await buscarCierreCajaIndividual(token))
      ?? (await buscarAjusteCapital(token))
      ?? (await buscarLetraCambio(token))
      ?? (await buscarResumenPrestamo(token))
      ?? (await buscarPagoLiquidado(token))
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
