-- Soporte para crédito de "solo intereses" (numeroCuotas = 0, sin fecha de
-- vencimiento fija) y persistencia de la preferencia de redondeo de cuota al
-- múltiplo de 1.000 más cercano (necesaria porque la cuota nunca se persiste,
-- siempre se recalcula en vivo — sin este flag el recálculo posterior
-- divergiría del valor que el operador ya comunicó al cliente).
--
-- NOTA: mismo caso que las migraciones 20260716120000/130000/140000 — el diff
-- automático también proponía dropear `uq_super_admin_por_tenant` /
-- `super_admin_tenant_id` en `empleados` (columna virtual GENERATED, CLAUDE.md
-- §6). Se excluye deliberadamente, no se toca.

-- AlterTable
ALTER TABLE `creditos`
  ADD COLUMN `redondear_cuota_mil` BOOLEAN NOT NULL DEFAULT true,
  MODIFY `fecha_vencimiento` DATETIME(3) NULL;
