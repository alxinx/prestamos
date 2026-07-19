-- Wizard de configuración inicial obligatorio (Capital + Cobrador mínimo) —
-- flag que indica si el tenant ya lo completó. Nunca vuelve a false una vez
-- en true (desactivar el capital/cobrador después no debe re-bloquear el panel).
--
-- NOTA: el diff automático de `prisma migrate dev` también propone un
-- DROP COLUMN `super_admin_tenant_id` en `empleados` — columna virtual
-- GENERATED (ver migración 20260704000003_indice_unico_super_admin_por_tenant,
-- CLAUDE.md §6). Se excluye deliberadamente de esta migración — no se toca.

-- AlterTable
ALTER TABLE `tenants`
  ADD COLUMN `onboarding_completado` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: todos los tenants existentes ya operan hoy sin este wizard — se
-- marcan como completados para que la migración no los bloquee retroactivamente.
-- Solo los tenants creados DESPUÉS de esta migración arrancan en false.
UPDATE `tenants` SET `onboarding_completado` = true;
