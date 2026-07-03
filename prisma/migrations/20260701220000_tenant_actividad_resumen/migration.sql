-- CreateTable
CREATE TABLE `tenant_actividad_resumen` (
  `tenant_id`               CHAR(36)     NOT NULL,
  `ultimo_pago_registrado`  DATETIME(3)  NULL,
  `ultimo_prestamo_creado`  DATETIME(3)  NULL,
  `ultimo_cierre_caja`      DATETIME(3)  NULL,
  `ultimo_login`            DATETIME(3)  NULL,
  `pagos_ultimos_30_dias`   INT          NOT NULL DEFAULT 0,
  `prestamos_activos`       INT          NOT NULL DEFAULT 0,
  `prestamos_creados_mes`   INT          NOT NULL DEFAULT 0,
  `estado_engagement`       ENUM('ACTIVO','EN_RIESGO','INACTIVO') NOT NULL,
  `fecha_calculo`           DATETIME(3)  NOT NULL,
  `created_at`              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`              DATETIME(3)  NOT NULL,

  PRIMARY KEY (`tenant_id`),
  CONSTRAINT `tenant_actividad_resumen_tenant_id_fkey`
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
