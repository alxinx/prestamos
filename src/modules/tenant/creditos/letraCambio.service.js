'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { generarTokenVerificacion } = require('../../../lib/tokenVerificacion')
const { generarQrSvg, urlVerificacion } = require('../../../lib/qr')
const { valorEnLetras } = require('../../../lib/valorEnLetras')

// Genera (imprime) una letra de cambio para un crédito ya otorgado. El nombre y
// la cédula del deudor salen siempre del cliente del crédito — nunca del body,
// para que no puedan alterarse desde el frontend — y se denormalizan en el
// registro (snapshot inmutable, igual que un voucher de capital) para que la
// verificación pública por QR siga siendo correcta aunque el cliente cambie de
// nombre o cédula después. `incluyeValor`/`incluyeBeneficiario`/`incluyeFecha`
// ya vienen validados por creditos.validator.js: si alguno es false, el campo
// asociado llega null/undefined y el documento impreso lo deja en blanco.
async function generarLetraCambio(req) {
  const { tenantId, id: empleadoId } = req.empleado
  const { id: creditoId } = req.params
  const { incluyeValor, valor, incluyeBeneficiario, beneficiario, incluyeFecha, fechaVencimiento } = req.body

  const [credito, tenant] = await Promise.all([
    prisma.credito.findFirst({
      where: { id: creditoId, tenantId },
      include: { cliente: { include: { clienteGlobal: { select: { nombreCompleto: true, cedula: true } } } } },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])
  // 404, nunca 403 — no revela si el crédito existe en otro tenant (CLAUDE.md §3).
  if (!credito) return { error: 'Crédito no encontrado', status: 404 }

  const id = uuidv7()
  const tokenVerificacion = generarTokenVerificacion()
  const esEnBlanco = !incluyeValor || !incluyeBeneficiario || !incluyeFecha
  const tenantNombre = tenant?.nombreNegocio ?? 'GotaPay'
  const deudorNombre = credito.cliente.clienteGlobal.nombreCompleto
  const deudorCedula = credito.cliente.clienteGlobal.cedula
  const valorFinal = incluyeValor ? valor : null
  const beneficiarioFinal = incluyeBeneficiario ? beneficiario : null
  const fechaVencimientoFinal = incluyeFecha ? new Date(fechaVencimiento) : null

  // Un solo create() con el token ya incluido en el `data` — ya es atómico, no
  // hace falta envolverlo en $transaction (a diferencia de un voucher de capital,
  // que sí escribe dos tablas: la caja y el movimiento).
  await prisma.letraCambio.create({
    data: {
      id,
      tenantId,
      creditoId,
      deudorNombre,
      deudorCedula,
      incluyeValor,
      valor: valorFinal,
      incluyeBeneficiario,
      beneficiario: beneficiarioFinal,
      incluyeFecha,
      fechaVencimiento: fechaVencimientoFinal,
      esEnBlanco,
      tokenVerificacion,
      generadoPorId: empleadoId,
    },
  })

  await registrarAuditoria({
    tenantId,
    empleadoId,
    accion: 'LETRA_CAMBIO_GENERADA',
    entidadTipo: 'Credito',
    entidadId: creditoId,
    valorNuevo: { valor: valorFinal, beneficiario: beneficiarioFinal, fechaVencimiento: fechaVencimiento || null, esEnBlanco },
  })

  return {
    letra: {
      tenantNombre,
      fecha: new Date().toISOString(),
      deudorNombre,
      deudorCedula,
      incluyeValor,
      valor: valorFinal,
      valorEnLetras: incluyeValor ? valorEnLetras(valorFinal) : null,
      incluyeBeneficiario,
      beneficiario: beneficiarioFinal,
      incluyeFecha,
      fechaVencimiento: incluyeFecha ? fechaVencimientoFinal.toISOString() : null,
      qrSvg: generarQrSvg(urlVerificacion(tokenVerificacion)),
    },
    cartaInstrucciones: esEnBlanco
      ? {
          tenantNombre,
          fecha: new Date().toISOString(),
          deudorNombre,
          deudorCedula,
          camposEnBlanco: [
            !incluyeValor && 'el valor de la letra',
            !incluyeBeneficiario && 'a favor de quién (beneficiario)',
            !incluyeFecha && 'la fecha de vencimiento',
          ].filter(Boolean),
        }
      : null,
  }
}

module.exports = { generarLetraCambio }
