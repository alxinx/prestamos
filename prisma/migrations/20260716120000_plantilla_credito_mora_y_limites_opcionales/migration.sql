-- Interés por mora configurable en la plantilla de crédito: si está activo,
-- baseCalculoMora indica si el % de mora se aplica sobre el interés causado o
-- sobre el capital, y diasGraciaMora cuántos días de atraso se toleran antes
-- de empezar a cobrarlo.
--
-- NOTA: el diff automático de `prisma migrate dev` también proponía un
-- DROP INDEX `uq_super_admin_por_tenant` y un DROP COLUMN `super_admin_tenant_id`
-- en `empleados` — esa columna es una columna virtual GENERATED ALWAYS AS
-- (ver migración 20260704000003_indice_unico_super_admin_por_tenant) que
-- implementa la regla de CLAUDE.md "un solo super admin por tenant" a nivel de
-- base de datos. No existe como campo en schema.prisma a propósito (Prisma no
-- soporta columnas generadas), así que SIEMPRE aparece como "drift" en el
-- diff automático. Se excluye deliberadamente de esta migración — no se toca.

-- AlterTable
ALTER TABLE `plantillas_credito`
  ADD COLUMN `base_calculo_mora` ENUM('INTERES', 'CAPITAL') NULL,
  ADD COLUMN `dias_gracia_mora` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `interes_mora_activo` BOOLEAN NOT NULL DEFAULT false;
