-- Columna generada: contiene tenant_id cuando es_super_admin = TRUE, NULL en caso contrario.
-- Los valores NULL no violan índices únicos en MySQL, lo que simula un índice único parcial.
ALTER TABLE `empleados`
  ADD COLUMN `super_admin_tenant_idx` CHAR(36) GENERATED ALWAYS AS (
    IF(`es_super_admin` = TRUE, `tenant_id`, NULL)
  ) STORED;

CREATE UNIQUE INDEX `un_super_admin_por_tenant`
  ON `empleados` (`super_admin_tenant_idx`);
