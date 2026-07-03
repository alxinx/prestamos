-- AlterTable
ALTER TABLE `tenants`
  ADD COLUMN `token_activacion` CHAR(64) NULL,
  ADD COLUMN `token_activacion_expira` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tenants_token_activacion_key` ON `tenants`(`token_activacion`);
