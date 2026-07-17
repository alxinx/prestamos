import { formatearPrecio } from './formato'

// Etiquetas y helpers de formato de PlantillaCredito — fuente única compartida
// entre ModalCrearPlantilla.jsx (formulario) e Intereses.jsx (tabla/resumen),
// para no divergir en silencio.

export const ETIQUETA_FRECUENCIA_PAGO = { DIARIO: 'Diario', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal', MENSUAL: 'Mensual' }
export const OPCIONES_FRECUENCIA_PAGO = Object.entries(ETIQUETA_FRECUENCIA_PAGO).map(([value, label]) => ({ value, label }))

export const ETIQUETA_BASE_CALCULO_MORA = { INTERES: 'Sobre el interés', CAPITAL: 'Sobre el capital' }
export const OPCIONES_BASE_CALCULO_MORA = Object.entries(ETIQUETA_BASE_CALCULO_MORA).map(([value, label]) => ({ value, label }))

// montoMinimo/montoMaximo en 0 = sin límite (decisión 2026-07-16, igual en backend).
export function rangoMontoPlantilla(montoMinimo, montoMaximo) {
  const sinMinimo = Number(montoMinimo) === 0
  const sinMaximo = Number(montoMaximo) === 0
  if (sinMinimo && sinMaximo) return 'Sin límite'
  if (sinMaximo) return `Desde ${formatearPrecio(montoMinimo)}`
  if (sinMinimo) return `Hasta ${formatearPrecio(montoMaximo)}`
  return `${formatearPrecio(montoMinimo)} – ${formatearPrecio(montoMaximo)}`
}

// numeroCuotas en 0 = cuotas indefinidas (decisión 2026-07-16, igual en backend).
export function textoCuotasPlantilla(numeroCuotas) {
  return Number(numeroCuotas) === 0 ? 'Indefinidas' : numeroCuotas
}
