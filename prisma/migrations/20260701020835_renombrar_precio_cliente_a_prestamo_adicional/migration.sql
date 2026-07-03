/*
  Warnings:

  - You are about to drop the column `precio_cliente_adicional` on the `planes` table. All the data in the column will be lost.
  - Added the required column `precio_prestamo_adicional` to the `planes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `planes` DROP COLUMN `precio_cliente_adicional`,
    ADD COLUMN `precio_prestamo_adicional` DECIMAL(15, 2) NOT NULL;
