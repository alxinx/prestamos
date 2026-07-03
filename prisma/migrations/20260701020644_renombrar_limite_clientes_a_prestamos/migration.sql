/*
  Warnings:

  - You are about to drop the column `super_admin_tenant_idx` on the `empleados` table. All the data in the column will be lost.
  - You are about to drop the column `limite_clientes` on the `planes` table. All the data in the column will be lost.
  - Added the required column `limite_prestamos` to the `planes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `un_super_admin_por_tenant` ON `empleados`;

-- AlterTable
ALTER TABLE `empleados` DROP COLUMN `super_admin_tenant_idx`;

-- AlterTable
ALTER TABLE `planes` DROP COLUMN `limite_clientes`,
    ADD COLUMN `limite_prestamos` INTEGER NOT NULL;
