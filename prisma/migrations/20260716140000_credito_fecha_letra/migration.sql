-- Fecha de la letra de cambio asociada al crédito (opcional, puede llenarse
-- después de crear el préstamo) — campo del wizard "Nuevo préstamo".
--
-- NOTA: mismo caso que las migraciones 20260716120000/20260716130000 — el diff
-- automático también proponía dropear `uq_super_admin_por_tenant` /
-- `super_admin_tenant_id` en `empleados` (columna virtual GENERATED, CLAUDE.md
-- §6). Se excluye deliberadamente, no se toca.

-- AlterTable
ALTER TABLE `creditos`
  ADD COLUMN `fecha_letra` DATETIME(3) NULL;
