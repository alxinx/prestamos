-- Agrega SUSPENSION y REACTIVACION al enum de tipo de movimiento de caja, para
-- registrar en el historial de movimientos cuando un capital se suspende o
-- reactiva (movimiento informativo, monto 0, no altera el saldo disponible).
ALTER TABLE `movimientos_caja`
  MODIFY COLUMN `tipo` ENUM('APORTE','RETIRO','PRESTAMO_OTORGADO','PAGO_RECIBIDO','UTILIDAD_RETIRADA','SUSPENSION','REACTIVACION') NOT NULL;
