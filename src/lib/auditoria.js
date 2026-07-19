'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('./prisma')

// Helper DRY para registrar acciones sensibles en AuditLog (créditos, pagos,
// aprobaciones, cierres de caja, cambios de estado, anulaciones, etc.).
// Los registros de auditoría son inmutables: solo se crean, nunca se editan ni se eliminan.
// tenantId es null para acciones globales de MasterAdmin que no pertenecen a un tenant (ej. Plan).
async function registrarAuditoria({ tenantId = null, empleadoId = null, accion, entidadTipo, entidadId, valorAnterior = null, valorNuevo = null, metadata = null, ipAddress = null }) {
  await prisma.auditLog.create({
    data: {
      id: uuidv7(),
      tenantId,
      empleadoId,
      accion,
      entidadTipo,
      entidadId,
      valorAnterior,
      valorNuevo,
      metadata,
      ipAddress,
      fecha: new Date(),
    },
  })
}

module.exports = { registrarAuditoria }
