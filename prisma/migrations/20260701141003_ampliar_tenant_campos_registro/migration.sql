/*
  Warnings:

  - Added the required column `nombre_completo` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_identificacion` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_identificacion` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_persona` to the `tenants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `nombre_completo` VARCHAR(191) NOT NULL,
    ADD COLUMN `numero_identificacion` VARCHAR(191) NOT NULL,
    ADD COLUMN `razon_social` VARCHAR(191) NULL,
    ADD COLUMN `telefono` VARCHAR(191) NULL,
    ADD COLUMN `tipo_identificacion` ENUM('NIT', 'CC', 'CE', 'PASAPORTE') NOT NULL,
    ADD COLUMN `tipo_persona` ENUM('NATURAL', 'JURIDICA') NOT NULL;
