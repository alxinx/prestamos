-- % que se cobra de interés por mora en la plantilla de crédito, cuando
-- interesMoraActivo = true (se aplica sobre baseCalculoMora: interés o capital).
--
-- NOTA: mismo caso que la migración 20260716120000 — el diff automático también
-- proponía dropear `uq_super_admin_por_tenant` / `super_admin_tenant_id` en
-- `empleados` (columna virtual GENERATED que implementa "un solo super admin
-- por tenant", CLAUDE.md §6). Se excluye deliberadamente, no se toca.

-- AlterTable
ALTER TABLE `plantillas_credito`
  ADD COLUMN `porcentaje_mora` DECIMAL(15, 2) NULL;
