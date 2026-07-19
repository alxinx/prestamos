-- Letra de cambio impresa para un crédito — snapshot inmutable con QR de
-- verificación pública (mismo patrón que movimientos_caja/cierre_caja_individual).
--
-- NOTA: mismo caso que las migraciones 20260716120000/20260716130000/20260716140000
-- — el diff automático también proponía dropear `uq_super_admin_por_tenant` /
-- `super_admin_tenant_id` en `empleados` (columna virtual GENERATED, CLAUDE.md §6).
-- Se excluye deliberadamente, no se toca.

-- CreateTable
CREATE TABLE `letras_cambio` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `deudor_nombre` VARCHAR(191) NOT NULL,
    `deudor_cedula` VARCHAR(191) NOT NULL,
    `incluye_valor` BOOLEAN NOT NULL,
    `valor` DECIMAL(15, 2) NULL,
    `incluye_beneficiario` BOOLEAN NOT NULL,
    `beneficiario` VARCHAR(191) NULL,
    `incluye_fecha` BOOLEAN NOT NULL,
    `fecha_vencimiento` DATETIME(3) NULL,
    `es_en_blanco` BOOLEAN NOT NULL,
    `token_verificacion` CHAR(64) NOT NULL,
    `generado_por_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `letras_cambio_token_verificacion_key`(`token_verificacion`),
    INDEX `letras_cambio_tenant_id_credito_id_idx`(`tenant_id`, `credito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `letras_cambio` ADD CONSTRAINT `letras_cambio_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letras_cambio` ADD CONSTRAINT `letras_cambio_generado_por_id_fkey` FOREIGN KEY (`generado_por_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
