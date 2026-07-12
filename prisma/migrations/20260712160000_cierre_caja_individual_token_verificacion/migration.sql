-- Token de verificación pública para el voucher impreso del cierre de caja
-- individual (QR -> GET /api/verificar/:token). 64 hex chars, no es el UUID v7
-- del registro.
ALTER TABLE `cierres_caja_individual`
  ADD COLUMN `token_verificacion` CHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `cierres_caja_individual_token_verificacion_key` ON `cierres_caja_individual`(`token_verificacion`);
