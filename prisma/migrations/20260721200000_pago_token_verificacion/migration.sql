-- Token de verificación pública del voucher de un pago liquidado (PAGO_LIQUIDADO,
-- QR -> GET /api/verificar/:token). Se genera solo al liquidar
-- (pagos.service.js/liquidarPago), nunca al registrar. 64 hex chars, no es el
-- UUID v7 del registro — mismo patrón que movimientos_caja.token_verificacion.
ALTER TABLE `pagos`
  ADD COLUMN `token_verificacion` CHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pagos_token_verificacion_key` ON `pagos`(`token_verificacion`);
