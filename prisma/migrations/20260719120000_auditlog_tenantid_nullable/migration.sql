-- Migración generada para documentar un cambio que ya estaba aplicado
-- directamente en la base de datos de desarrollo (drift detectado el
-- 2026-07-21 al intentar aplicar la migración de Pago.tokenVerificacion) —
-- no se encontró el motivo de negocio original de por qué tenant_id pasó a
-- ser nullable en audit_logs; ningún código actual (registrarAuditoria) deja
-- de pasar tenantId. Se documenta tal cual está en la BD real, sin revertir
-- datos existentes.

-- AlterTable
ALTER TABLE `audit_logs`
  MODIFY COLUMN `tenant_id` CHAR(36) NULL;
