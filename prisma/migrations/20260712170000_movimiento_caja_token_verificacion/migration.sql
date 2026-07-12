-- Token de verificación pública del voucher impreso de aporte/retiro de capital
-- (QR -> GET /api/verificar/:token). 64 hex chars, no es el UUID v7 del registro.
ALTER TABLE `movimientos_caja`
  ADD COLUMN `token_verificacion` CHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `movimientos_caja_token_verificacion_key` ON `movimientos_caja`(`token_verificacion`);
