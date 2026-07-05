-- MySQL no admite índices únicos parciales con WHERE.
-- Solución: columna virtual que vale tenant_id cuando es_super_admin = 1 y NULL en otro caso.
-- Los NULL no entran en conflicto en un índice UNIQUE, por lo que esto garantiza
-- que solo exista un super admin por tenant a nivel de base de datos.

ALTER TABLE `empleados`
  ADD COLUMN `super_admin_tenant_id` CHAR(36) GENERATED ALWAYS AS (
    IF(`es_super_admin` = 1, `tenant_id`, NULL)
  ) VIRTUAL;

CREATE UNIQUE INDEX `uq_super_admin_por_tenant`
  ON `empleados` (`super_admin_tenant_id`);
