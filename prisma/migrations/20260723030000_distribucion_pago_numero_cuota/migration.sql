-- Un Pago puede repartirse entre varias cuotas (una fila de DistribucionPago
-- por cuota tocada, motor de aplicación por cuota — spec 2026-07-23). Se
-- persiste el número y fecha de la cuota porque es un hecho de la
-- transacción, no un valor calculado — evita tener que re-derivarlo después
-- para el voucher o el historial de "Pagos realizados". Null en créditos de
-- solo intereses y en la fila "extra" del sobrante elegido por el operador.
ALTER TABLE `distribucion_pagos`
  ADD COLUMN `numero_cuota` INT NULL,
  ADD COLUMN `fecha_cuota` DATETIME(3) NULL;
