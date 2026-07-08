-- AlterTable
ALTER TABLE `empleados` MODIFY COLUMN `password_hash` VARCHAR(191) NULL;
ALTER TABLE `empleados` ADD COLUMN `token_activacion` CHAR(64) NULL;
ALTER TABLE `empleados` ADD COLUMN `token_activacion_expira` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `empleados_token_activacion_key` ON `empleados`(`token_activacion`);
