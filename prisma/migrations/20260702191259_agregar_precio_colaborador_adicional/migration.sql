-- AlterTable: agrega precio_colaborador_adicional con default 0 para filas existentes y luego elimina el default
ALTER TABLE `planes` ADD COLUMN `precio_colaborador_adicional` DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE `planes` ALTER COLUMN `precio_colaborador_adicional` DROP DEFAULT;
