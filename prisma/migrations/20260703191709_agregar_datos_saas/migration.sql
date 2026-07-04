-- CreateTable
CREATE TABLE `datos_saas` (
    `id` VARCHAR(36) NOT NULL DEFAULT 'singleton',
    `nombre_razon_social` VARCHAR(200) NOT NULL,
    `nit` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
