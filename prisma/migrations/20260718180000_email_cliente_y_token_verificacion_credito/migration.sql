-- Email opcional del cliente (ClienteGlobal) — usado para enviarle el PDF de
-- resumen de préstamo al otorgar un crédito, sin bloquear nada si falta.
--
-- Token de verificación pública del PDF de "Resumen de préstamo" (QR -> GET
-- /api/verificar/:token), directo sobre `creditos` (no una tabla aparte) porque
-- el resumen es 1:1 con el crédito, generado una sola vez automáticamente.
-- 64 hex chars, no es el UUID v7 del registro — mismo patrón que
-- movimientos_caja.token_verificacion (ver migración 20260712170000).
--
-- NOTA: el diff automático de `prisma migrate dev` también propone un
-- DROP COLUMN `super_admin_tenant_id` en `empleados` — columna virtual
-- GENERATED (ver migración 20260704000003_indice_unico_super_admin_por_tenant,
-- CLAUDE.md §6). Se excluye deliberadamente de esta migración, igual que en
-- 20260716120000/20260716130000 — no se toca.

-- AlterTable
ALTER TABLE `clientes_globales`
  ADD COLUMN `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `creditos`
  ADD COLUMN `token_verificacion` CHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `creditos_token_verificacion_key` ON `creditos`(`token_verificacion`);
