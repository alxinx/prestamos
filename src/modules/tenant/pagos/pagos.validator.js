'use strict'

const { z } = require('zod')
const { crearValidador } = require('../../../lib/validar')

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO']

const esquemaRegistrarPago = z.object({
  creditoId:     z.string().uuid('Selecciona un crédito'),
  montoRecibido: z.coerce.number().positive('El monto recibido debe ser mayor a 0'),
  metodoPago:    z.enum(METODOS_PAGO, { errorMap: () => ({ message: 'Método de pago inválido' }) }),
  // Solo aplica a créditos de solo intereses cuando el abono deja sobrante
  // después de recargos+interés (PARTE 3 de la spec) — el operador elige
  // antes de poder registrar.
  sobranteDestino: z.enum(['CAPITAL', 'PROXIMAS_CUOTAS']).optional(),
})

const validarRegistrarPago = crearValidador(esquemaRegistrarPago)

module.exports = { validarRegistrarPago, esquemaRegistrarPago }
