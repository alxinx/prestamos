-- CreateTable
CREATE TABLE `master_admins` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `dos_fa_secreto` VARCHAR(191) NOT NULL,
    `ip_whitelist` JSON NOT NULL,
    `ultimo_acceso` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planes` (
    `id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `precio` DECIMAL(15, 2) NOT NULL,
    `limite_cobradores` INTEGER NOT NULL,
    `limite_clientes` INTEGER NOT NULL,
    `limite_mensajes_wsp` INTEGER NOT NULL,
    `consultas_score` INTEGER NOT NULL,
    `tiene_bot` BOOLEAN NOT NULL DEFAULT false,
    `tiene_portal_cliente` BOOLEAN NOT NULL DEFAULT false,
    `tiene_firma_digital` BOOLEAN NOT NULL DEFAULT false,
    `precio_cliente_adicional` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `id` CHAR(36) NOT NULL,
    `plan_id` CHAR(36) NOT NULL,
    `nombre_negocio` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subdominio` VARCHAR(191) NOT NULL,
    `estado` ENUM('ACTIVO', 'PERIODO_GRACIA', 'SUSPENDIDO', 'CANCELADO') NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_vencimiento` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_subdominio_key`(`subdominio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `plan_id` CHAR(36) NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `valor_plan` DECIMAL(15, 2) NOT NULL,
    `clientes_excedentes` INTEGER NOT NULL DEFAULT 0,
    `valor_excedentes` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_factura` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('PENDIENTE', 'PAGADO', 'FALLIDO', 'VENCIDO') NOT NULL,
    `fecha_generacion` DATETIME(3) NOT NULL,
    `fecha_vencimiento` DATETIME(3) NOT NULL,
    `fecha_pago` DATETIME(3) NULL,
    `metodo_pago` VARCHAR(191) NULL,
    `referencia_transaccion` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_manuales` (
    `id` CHAR(36) NOT NULL,
    `factura_id` CHAR(36) NOT NULL,
    `valor_pagado` DECIMAL(15, 2) NOT NULL,
    `metodo` ENUM('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO') NOT NULL,
    `comprobante_url` VARCHAR(191) NULL,
    `observaciones` TEXT NULL,
    `fecha_pago` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suspensiones` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `tipo_suspension` ENUM('AUTOMATICA', 'MANUAL') NOT NULL,
    `motivo` ENUM('PAGO_VENCIDO', 'SOLICITUD_TENANT', 'FRAUDE', 'OTRO') NOT NULL,
    `fecha_suspension` DATETIME(3) NOT NULL,
    `periodo_gracia_dias` INTEGER NOT NULL,
    `fecha_limite_pago` DATETIME(3) NOT NULL,
    `reactivado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_reactivacion` DATETIME(3) NULL,
    `tipo_reactivacion` ENUM('PASARELA_AUTOMATICA', 'PAGO_MANUAL_MASTERADMIN', 'MANUAL_SIN_PAGO') NULL,
    `motivo_reactivacion_sin_pago` TEXT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impersonaciones_tenant` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `motivo` TEXT NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NULL,
    `ip_address` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria_master_admin` (
    `id` CHAR(36) NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `tenant_id_afectado` CHAR(36) NULL,
    `detalles` JSON NOT NULL,
    `ip_address` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entidades` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `tipo_persona` ENUM('NATURAL', 'JURIDICA') NOT NULL,
    `nombre_completo` VARCHAR(191) NULL,
    `razon_social` VARCHAR(191) NULL,
    `nit` VARCHAR(191) NULL,
    `cedula` VARCHAR(191) NULL,
    `representante_legal` VARCHAR(191) NULL,
    `cedula_representante` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `entidades_tenant_id_key`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ubicaciones_entidad` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `tipo` ENUM('SEDE_PRINCIPAL', 'SEDE_SECUNDARIA') NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NOT NULL,
    `referencia` TEXT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_operativa` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `hora_limite_cierre_caja` VARCHAR(191) NOT NULL,
    `dias_gracia_mora` INTEGER NOT NULL,
    `porcentaje_mora_diario` DECIMAL(15, 2) NOT NULL,
    `frecuencias_disponibles` JSON NOT NULL,
    `monto_minimo_prestamo` DECIMAL(15, 2) NOT NULL,
    `monto_maximo_prestamo` DECIMAL(15, 2) NOT NULL,
    `limite_solicitudes_extemporaneas` INTEGER NOT NULL,
    `dias_maximos_extemporaneo` INTEGER NOT NULL,
    `distribucion_automatica_capital` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracion_operativa_tenant_id_key`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_whatsapp` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `numero_registrado` VARCHAR(191) NULL,
    `estado` ENUM('NO_CONFIGURADO', 'ACTIVO', 'SUSPENDIDO', 'ERROR') NOT NULL,
    `mensajes_sent_mes` INTEGER NOT NULL DEFAULT 0,
    `ultima_actualizacion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracion_whatsapp_tenant_id_key`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_pagos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `proveedor` ENUM('NEQUI', 'DAVIPLATA', 'PSE') NOT NULL,
    `api_key` VARCHAR(191) NULL,
    `api_secret` VARCHAR(191) NULL,
    `estado` ENUM('NO_CONFIGURADO', 'CONECTADO', 'ERROR') NOT NULL,
    `ultima_transaccion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `nombre` ENUM('COBRADOR', 'SECRETARIA', 'ADMINISTRADOR', 'AUDITOR') NOT NULL,
    `es_predefinido` BOOLEAN NOT NULL DEFAULT true,
    `descripcion` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `rol_id` CHAR(36) NOT NULL,
    `nombre_completo` VARCHAR(191) NOT NULL,
    `cedula` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NULL,
    `fecha_ingreso` DATETIME(3) NOT NULL,
    `es_super_admin` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'RETIRADO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empleados_tenant_id_email_key`(`tenant_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permisos_catalogo` (
    `id` CHAR(36) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `modulo` ENUM('CAPITAL', 'CLIENTES', 'CREDITOS', 'COBROS', 'EMPLEADOS', 'REPORTES', 'CAJA', 'TESORERIA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permisos_catalogo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_permisos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `rol_id` CHAR(36) NOT NULL,
    `permiso_catalogo_id` CHAR(36) NOT NULL,
    `activo` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleado_permisos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `empleado_id` CHAR(36) NOT NULL,
    `permiso_catalogo_id` CHAR(36) NOT NULL,
    `activo` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zonas_cobertura` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleado_zonas` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `empleado_id` CHAR(36) NOT NULL,
    `zona_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `entidad_tipo` ENUM('CLIENTE', 'EMPLEADO', 'ENTIDAD', 'CREDITO') NOT NULL,
    `entidad_id` CHAR(36) NOT NULL,
    `tipo_documento` ENUM('CEDULA', 'CONTRATO', 'FOTO', 'ANTECEDENTES', 'RUT', 'CAMARA_COMERCIO', 'RECIBO_PUBLICO', 'REFERENCIA', 'LETRA_CAMBIO', 'FIRMA_OTP', 'COMPROBANTE', 'OTRO') NOT NULL,
    `nombre_archivo` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tamanio_bytes` INTEGER NULL,
    `metadatos_otp` JSON NULL,
    `subido_por` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes_globales` (
    `id` CHAR(36) NOT NULL,
    `cedula` VARCHAR(191) NOT NULL,
    `nombre_completo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `fecha_nacimiento` DATETIME(3) NULL,
    `score_global` DECIMAL(15, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_globales_cedula_key`(`cedula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_global_id` CHAR(36) NOT NULL,
    `zona_id` CHAR(36) NULL,
    `cobrador_id` CHAR(36) NULL,
    `estado` ENUM('ACTIVO', 'EN_MORA', 'BLOQUEADO', 'INACTIVO', 'FALLECIDO') NOT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ubicaciones_cliente` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `tipo` ENUM('RESIDENCIA', 'TRABAJO', 'NEGOCIO_PROPIO', 'DONDE_SE_FIRMO', 'FAMILIAR', 'OTRO') NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NOT NULL,
    `referencia` TEXT NULL,
    `horario_ubicacion` VARCHAR(191) NULL,
    `latitud` DECIMAL(15, 2) NULL,
    `longitud` DECIMAL(15, 2) NULL,
    `es_principal` BOOLEAN NOT NULL DEFAULT false,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referencias_personales` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `nombre_completo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `relacion_con_cliente` ENUM('FAMILIAR', 'AMIGO', 'COLEGA', 'VECINO', 'OTRO') NOT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scores_internos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `score_actual` DECIMAL(15, 2) NOT NULL,
    `pagos_puntuales` INTEGER NOT NULL DEFAULT 0,
    `pagos_anticipados` INTEGER NOT NULL DEFAULT 0,
    `abonos_parciales` INTEGER NOT NULL DEFAULT 0,
    `veces_en_mora` INTEGER NOT NULL DEFAULT 0,
    `dias_promedio_mora` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `registros_extemporaneos` INTEGER NOT NULL DEFAULT 0,
    `fecha_ultimo_calculo` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `scores_internos_cliente_id_key`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_scores` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `score_anterior` DECIMAL(15, 2) NOT NULL,
    `score_nuevo` DECIMAL(15, 2) NOT NULL,
    `motivo_cambio` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consentimientos` (
    `id` CHAR(36) NOT NULL,
    `cliente_global_id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `tratamiento_datos` BOOLEAN NOT NULL DEFAULT false,
    `fecha_tratamiento_datos` DATETIME(3) NULL,
    `compartir_score` BOOLEAN NOT NULL DEFAULT false,
    `fecha_compartir_score` DATETIME(3) NULL,
    `recibir_notificaciones_wsp` BOOLEAN NOT NULL DEFAULT false,
    `fecha_notificaciones_wsp` DATETIME(3) NULL,
    `evidencia_otp` VARCHAR(191) NULL,
    `ip_firma` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `socios` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `empleado_id` CHAR(36) NULL,
    `nombre_completo` VARCHAR(191) NOT NULL,
    `cedula` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `observaciones` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cajas` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `socio_id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `capital_inicial` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('ACTIVA', 'INACTIVA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_caja` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `caja_id` CHAR(36) NOT NULL,
    `tipo` ENUM('APORTE', 'RETIRO', 'PRESTAMO_OTORGADO', 'PAGO_RECIBIDO', 'UTILIDAD_RETIRADA') NOT NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `referencia_id` CHAR(36) NULL,
    `referencia_tipo` VARCHAR(191) NULL,
    `saldo_despues_movimiento` DECIMAL(15, 2) NOT NULL,
    `registrado_por` CHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distribucion_utilidades` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `caja_id` CHAR(36) NOT NULL,
    `socio_id` CHAR(36) NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `utilidades_generadas` DECIMAL(15, 2) NOT NULL,
    `monto_retirado` DECIMAL(15, 2) NOT NULL,
    `fecha_retiro` DATETIME(3) NOT NULL,
    `aprobado_por` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plantillas_credito` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `plazo` INTEGER NOT NULL,
    `tasa_interes` DECIMAL(15, 2) NOT NULL,
    `numero_cuotas` INTEGER NOT NULL,
    `frecuencia_pago` ENUM('DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL') NOT NULL,
    `monto_minimo` DECIMAL(15, 2) NOT NULL,
    `monto_maximo` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('ACTIVA', 'INACTIVA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creditos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `cobrador_id` CHAR(36) NOT NULL,
    `caja_id` CHAR(36) NOT NULL,
    `plantilla_id` CHAR(36) NULL,
    `monto_inicial` DECIMAL(15, 2) NOT NULL,
    `tasa_interes` DECIMAL(15, 2) NOT NULL,
    `plazo` INTEGER NOT NULL,
    `numero_cuotas` INTEGER NOT NULL,
    `frecuencia_pago` ENUM('DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL') NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_vencimiento` DATETIME(3) NOT NULL,
    `estado` ENUM('ACTIVO', 'PAGADO', 'EN_MORA', 'VENCIDO', 'CASTIGADO', 'REFINANCIADO') NOT NULL,
    `credito_refinanciado_id` CHAR(36) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estado_credito` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `estado_anterior` ENUM('ACTIVO', 'PAGADO', 'EN_MORA', 'VENCIDO', 'CASTIGADO', 'REFINANCIADO') NOT NULL,
    `estado_nuevo` ENUM('ACTIVO', 'PAGADO', 'EN_MORA', 'VENCIDO', 'CASTIGADO', 'REFINANCIADO') NOT NULL,
    `motivo` TEXT NULL,
    `cambiado_por` CHAR(36) NULL,
    `fecha` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `empleado_id` CHAR(36) NOT NULL,
    `monto_recibido` DECIMAL(15, 2) NOT NULL,
    `metodo_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO') NOT NULL,
    `tipo` ENUM('PAGO_CUOTA', 'ABONO_PARCIAL', 'PAGO_TOTAL', 'PAGO_MULTIPLES_CREDITOS', 'PAGO_COMPROBANTE_ADMIN') NOT NULL,
    `estado` ENUM('PENDIENTE_LIQUIDAR', 'LIQUIDADO', 'ANULADO') NOT NULL,
    `fecha_registro` DATETIME(3) NOT NULL,
    `fecha_liquidacion` DATETIME(3) NULL,
    `liquidado_por` CHAR(36) NULL,
    `comprobante_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distribucion_pagos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `pago_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `valor_mora` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `valor_recargos` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `valor_intereses` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `valor_capital` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_aplicado` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moras_aplicadas` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `fecha_inicio_mora` DATETIME(3) NOT NULL,
    `fecha_fin_mora` DATETIME(3) NULL,
    `dias_mora` INTEGER NOT NULL,
    `porcentaje_mora` DECIMAL(15, 2) NOT NULL,
    `valor_mora` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('VIGENTE', 'PAGADA', 'CONDONADA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recargos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `tipo` ENUM('GASTO_COBRANZA', 'PENALIZACION', 'OTRO') NOT NULL,
    `valor` DECIMAL(15, 2) NOT NULL,
    `motivo` TEXT NOT NULL,
    `aplicado_por` CHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `garantias` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `tipo` ENUM('MOTO', 'VEHICULO', 'ELECTRODOMESTICO', 'PAGARE', 'LETRA_CAMBIO', 'DOCUMENTO_FIRMADO', 'INMUEBLE', 'OTRO') NOT NULL,
    `descripcion` TEXT NOT NULL,
    `valor_estimado` DECIMAL(15, 2) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deudores_solidarios` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `cliente_id` CHAR(36) NULL,
    `nombre_completo` VARCHAR(191) NULL,
    `cedula` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `relacion_con_deudor` ENUM('FAMILIAR', 'AMIGO', 'COLEGA', 'VECINO', 'OTRO') NOT NULL,
    `firmo_documento` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('ACTIVO', 'LIBERADO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anulaciones_pago` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `pago_id` CHAR(36) NOT NULL,
    `anulado_por` CHAR(36) NOT NULL,
    `motivo` TEXT NOT NULL,
    `estado_credito_antes_anulacion` ENUM('ACTIVO', 'PAGADO', 'EN_MORA', 'VENCIDO', 'CASTIGADO', 'REFINANCIADO') NOT NULL,
    `fecha_anulacion` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `anulaciones_pago_pago_id_key`(`pago_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cierres_caja_individual` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cobrador_id` CHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `total_segun_sistema` DECIMAL(15, 2) NOT NULL,
    `total_entregado_cobrador` DECIMAL(15, 2) NOT NULL,
    `diferencia` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') NOT NULL,
    `aprobado_por` CHAR(36) NULL,
    `fecha_aprobacion` DATETIME(3) NULL,
    `movimiento_tesoreria_id` CHAR(36) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cierres_caja_global` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `total_recaudado_cobradores` DECIMAL(15, 2) NOT NULL,
    `total_pagos_digitales` DECIMAL(15, 2) NOT NULL,
    `total_ingresos_dia` DECIMAL(15, 2) NOT NULL,
    `total_egresos_dia` DECIMAL(15, 2) NOT NULL,
    `saldo_inicial_dia` DECIMAL(15, 2) NOT NULL,
    `saldo_final_dia` DECIMAL(15, 2) NOT NULL,
    `diferencias_detectadas` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `estado` ENUM('PENDIENTE', 'CERRADO') NOT NULL,
    `bloquea_admin` BOOLEAN NOT NULL DEFAULT true,
    `cerrado_por` CHAR(36) NULL,
    `fecha_cierre` DATETIME(3) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_cierre_caja_global` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cierre_caja_global_id` CHAR(36) NOT NULL,
    `cuenta_caja_id` CHAR(36) NOT NULL,
    `saldo_inicio` DECIMAL(15, 2) NOT NULL,
    `total_ingresos` DECIMAL(15, 2) NOT NULL,
    `total_egresos` DECIMAL(15, 2) NOT NULL,
    `saldo_final` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_extemporaneas` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cobrador_id` CHAR(36) NOT NULL,
    `credito_id` CHAR(36) NOT NULL,
    `fecha_original` DATETIME(3) NOT NULL,
    `valor` DECIMAL(15, 2) NOT NULL,
    `motivo` TEXT NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL,
    `aprobado_por` CHAR(36) NULL,
    `motivo_rechazo` TEXT NULL,
    `resuelto_por` DATETIME(3) NULL,
    `pago_generado_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `solicitudes_extemporaneas_pago_generado_id_key`(`pago_generado_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuentas_caja` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `caja_capital_id` CHAR(36) NULL,
    `tipo` ENUM('BANCO', 'BILLETERA_DIGITAL', 'CAJA_FUERTE') NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `entidad` VARCHAR(191) NULL,
    `numero_cuenta` VARCHAR(191) NULL,
    `es_caja_principal` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('ACTIVA', 'INACTIVA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_tesoreria` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `tipo` ENUM('INGRESO', 'EGRESO', 'TRASLADO') NOT NULL,
    `subtipo` ENUM('LIQUIDACION_COBRADOR', 'CONSIGNACION_CLIENTE_BANCO', 'CONSIGNACION_CLIENTE_BILLETERA', 'APORTE_SOCIO', 'OTRO_INGRESO', 'PRESTAMO_OTORGADO', 'RETIRO_UTILIDADES_SOCIO', 'GASTO_OPERATIVO', 'NOMINA_COBRADOR', 'DEVOLUCION_CLIENTE', 'OTRO_EGRESO', 'BANCO_A_CAJA_CAPITAL', 'CAJA_CAPITAL_A_BANCO', 'ENTRE_CUENTAS') NOT NULL,
    `cuenta_origen_id` CHAR(36) NULL,
    `cuenta_destino_id` CHAR(36) NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `fecha_movimiento` DATETIME(3) NOT NULL,
    `referencia_tipo` VARCHAR(191) NULL,
    `referencia_id` CHAR(36) NULL,
    `comprobante_url` VARCHAR(191) NULL,
    `registrado_por` CHAR(36) NOT NULL,
    `aprobado_por` CHAR(36) NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADO', 'ANULADO') NOT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consignaciones` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cuenta_destino_id` CHAR(36) NOT NULL,
    `fecha_consignacion` DATETIME(3) NOT NULL,
    `valor_total` DECIMAL(15, 2) NOT NULL,
    `comprobante_url` VARCHAR(191) NULL,
    `registrado_por` CHAR(36) NOT NULL,
    `estado` ENUM('PENDIENTE', 'VERIFICADA', 'RECHAZADA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consignacion_movimientos` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `consignacion_id` CHAR(36) NOT NULL,
    `movimiento_id` CHAR(36) NOT NULL,
    `valor_aplicado` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresos_programados` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `fecha_programada` DATETIME(3) NOT NULL,
    `cuenta_origen_id` CHAR(36) NOT NULL,
    `tipo_egreso` ENUM('NOMINA', 'GASTO_OPERATIVO', 'RETIRO_SOCIO', 'OTRO') NOT NULL,
    `estado` ENUM('PROGRAMADO', 'EJECUTADO', 'CANCELADO') NOT NULL,
    `movimiento_generado_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `egresos_programados_movimiento_generado_id_key`(`movimiento_generado_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conciliaciones` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `cuenta_caja_id` CHAR(36) NOT NULL,
    `fecha_corte` DATETIME(3) NOT NULL,
    `saldo_segun_sistema` DECIMAL(15, 2) NOT NULL,
    `saldo_real` DECIMAL(15, 2) NOT NULL,
    `diferencia` DECIMAL(15, 2) NOT NULL,
    `estado` ENUM('CUADRADO', 'DESCUADRADO') NOT NULL,
    `observaciones` TEXT NULL,
    `revisado_por` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `tenant_id` CHAR(36) NOT NULL,
    `empleado_id` CHAR(36) NULL,
    `accion` VARCHAR(191) NOT NULL,
    `entidad_tipo` VARCHAR(191) NOT NULL,
    `entidad_id` CHAR(36) NOT NULL,
    `valor_anterior` JSON NULL,
    `valor_nuevo` JSON NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_manuales` ADD CONSTRAINT `pagos_manuales_factura_id_fkey` FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suspensiones` ADD CONSTRAINT `suspensiones_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impersonaciones_tenant` ADD CONSTRAINT `impersonaciones_tenant_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empleados` ADD CONSTRAINT `empleados_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permisos` ADD CONSTRAINT `rol_permisos_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permisos` ADD CONSTRAINT `rol_permisos_permiso_catalogo_id_fkey` FOREIGN KEY (`permiso_catalogo_id`) REFERENCES `permisos_catalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empleado_permisos` ADD CONSTRAINT `empleado_permisos_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empleado_permisos` ADD CONSTRAINT `empleado_permisos_permiso_catalogo_id_fkey` FOREIGN KEY (`permiso_catalogo_id`) REFERENCES `permisos_catalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empleado_zonas` ADD CONSTRAINT `empleado_zonas_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empleado_zonas` ADD CONSTRAINT `empleado_zonas_zona_id_fkey` FOREIGN KEY (`zona_id`) REFERENCES `zonas_cobertura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_subido_por_fkey` FOREIGN KEY (`subido_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_cliente_global_id_fkey` FOREIGN KEY (`cliente_global_id`) REFERENCES `clientes_globales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_zona_id_fkey` FOREIGN KEY (`zona_id`) REFERENCES `zonas_cobertura`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_cobrador_id_fkey` FOREIGN KEY (`cobrador_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ubicaciones_cliente` ADD CONSTRAINT `ubicaciones_cliente_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referencias_personales` ADD CONSTRAINT `referencias_personales_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scores_internos` ADD CONSTRAINT `scores_internos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_scores` ADD CONSTRAINT `historial_scores_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consentimientos` ADD CONSTRAINT `consentimientos_cliente_global_id_fkey` FOREIGN KEY (`cliente_global_id`) REFERENCES `clientes_globales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `socios` ADD CONSTRAINT `socios_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribucion_utilidades` ADD CONSTRAINT `distribucion_utilidades_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribucion_utilidades` ADD CONSTRAINT `distribucion_utilidades_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribucion_utilidades` ADD CONSTRAINT `distribucion_utilidades_aprobado_por_fkey` FOREIGN KEY (`aprobado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_cobrador_id_fkey` FOREIGN KEY (`cobrador_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_plantilla_id_fkey` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_credito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_credito_refinanciado_id_fkey` FOREIGN KEY (`credito_refinanciado_id`) REFERENCES `creditos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado_credito` ADD CONSTRAINT `historial_estado_credito_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado_credito` ADD CONSTRAINT `historial_estado_credito_cambiado_por_fkey` FOREIGN KEY (`cambiado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_liquidado_por_fkey` FOREIGN KEY (`liquidado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribucion_pagos` ADD CONSTRAINT `distribucion_pagos_pago_id_fkey` FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribucion_pagos` ADD CONSTRAINT `distribucion_pagos_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moras_aplicadas` ADD CONSTRAINT `moras_aplicadas_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recargos` ADD CONSTRAINT `recargos_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recargos` ADD CONSTRAINT `recargos_aplicado_por_fkey` FOREIGN KEY (`aplicado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `garantias` ADD CONSTRAINT `garantias_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deudores_solidarios` ADD CONSTRAINT `deudores_solidarios_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deudores_solidarios` ADD CONSTRAINT `deudores_solidarios_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anulaciones_pago` ADD CONSTRAINT `anulaciones_pago_pago_id_fkey` FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anulaciones_pago` ADD CONSTRAINT `anulaciones_pago_anulado_por_fkey` FOREIGN KEY (`anulado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_caja_individual` ADD CONSTRAINT `cierres_caja_individual_cobrador_id_fkey` FOREIGN KEY (`cobrador_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_caja_individual` ADD CONSTRAINT `cierres_caja_individual_aprobado_por_fkey` FOREIGN KEY (`aprobado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_caja_individual` ADD CONSTRAINT `cierres_caja_individual_movimiento_tesoreria_id_fkey` FOREIGN KEY (`movimiento_tesoreria_id`) REFERENCES `movimientos_tesoreria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_caja_global` ADD CONSTRAINT `cierres_caja_global_cerrado_por_fkey` FOREIGN KEY (`cerrado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_cierre_caja_global` ADD CONSTRAINT `detalles_cierre_caja_global_cierre_caja_global_id_fkey` FOREIGN KEY (`cierre_caja_global_id`) REFERENCES `cierres_caja_global`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_cierre_caja_global` ADD CONSTRAINT `detalles_cierre_caja_global_cuenta_caja_id_fkey` FOREIGN KEY (`cuenta_caja_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_extemporaneas` ADD CONSTRAINT `solicitudes_extemporaneas_cobrador_id_fkey` FOREIGN KEY (`cobrador_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_extemporaneas` ADD CONSTRAINT `solicitudes_extemporaneas_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_extemporaneas` ADD CONSTRAINT `solicitudes_extemporaneas_aprobado_por_fkey` FOREIGN KEY (`aprobado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_extemporaneas` ADD CONSTRAINT `solicitudes_extemporaneas_pago_generado_id_fkey` FOREIGN KEY (`pago_generado_id`) REFERENCES `pagos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuentas_caja` ADD CONSTRAINT `cuentas_caja_caja_capital_id_fkey` FOREIGN KEY (`caja_capital_id`) REFERENCES `cajas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_tesoreria` ADD CONSTRAINT `movimientos_tesoreria_cuenta_origen_id_fkey` FOREIGN KEY (`cuenta_origen_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_tesoreria` ADD CONSTRAINT `movimientos_tesoreria_cuenta_destino_id_fkey` FOREIGN KEY (`cuenta_destino_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_tesoreria` ADD CONSTRAINT `movimientos_tesoreria_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_tesoreria` ADD CONSTRAINT `movimientos_tesoreria_aprobado_por_fkey` FOREIGN KEY (`aprobado_por`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consignaciones` ADD CONSTRAINT `consignaciones_cuenta_destino_id_fkey` FOREIGN KEY (`cuenta_destino_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consignaciones` ADD CONSTRAINT `consignaciones_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consignacion_movimientos` ADD CONSTRAINT `consignacion_movimientos_consignacion_id_fkey` FOREIGN KEY (`consignacion_id`) REFERENCES `consignaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consignacion_movimientos` ADD CONSTRAINT `consignacion_movimientos_movimiento_id_fkey` FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos_tesoreria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos_programados` ADD CONSTRAINT `egresos_programados_cuenta_origen_id_fkey` FOREIGN KEY (`cuenta_origen_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos_programados` ADD CONSTRAINT `egresos_programados_movimiento_generado_id_fkey` FOREIGN KEY (`movimiento_generado_id`) REFERENCES `movimientos_tesoreria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conciliaciones` ADD CONSTRAINT `conciliaciones_cuenta_caja_id_fkey` FOREIGN KEY (`cuenta_caja_id`) REFERENCES `cuentas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conciliaciones` ADD CONSTRAINT `conciliaciones_revisado_por_fkey` FOREIGN KEY (`revisado_por`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
