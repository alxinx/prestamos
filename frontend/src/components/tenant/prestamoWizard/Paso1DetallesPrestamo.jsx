import CampoTexto from '../CampoTexto'
import CampoMoneda from '../CampoMoneda'
import CampoSelect from '../CampoSelect'
import CampoFecha from '../CampoFecha'
import Interruptor from '../Interruptor'
import { rangoMontoPlantilla } from '../../../lib/plantillaCreditoFormato'

const FRECUENCIAS = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
]

// Paso 1 — condiciones generales del préstamo. Al elegir una plantilla se
// autocompletan tasa/cuotas/frecuencia, pero ningún campo queda bloqueado: el
// operador siempre puede corregirlos (decisión 2026-07-16). El monto se valida
// contra el rango [montoMinimo, montoMaximo] de la plantilla si aplica — 0 en
// cualquiera de los dos = sin límite, mismo criterio que Intereses.jsx.
//
// Número de cuotas también acepta 0: es un crédito de "solo intereses" — se
// cobra la tasa periódicamente y el capital se paga aparte cuando el cliente
// decida (decisión 2026-07-16, ver Resumen del crédito para el detalle).
export default function Paso1DetallesPrestamo({
  plantillas, plantillaId, onCambiarPlantilla, detalles, onCambiarDetalle,
  redondearCuotaMil, onCambiarRedondeo,
}) {
  const plantilla = plantillas.find(p => p.id === plantillaId)

  const monto = Number(detalles.montoInicial) || 0
  const minimo = plantilla ? Number(plantilla.montoMinimo) : 0
  const maximo = plantilla ? Number(plantilla.montoMaximo) : 0
  const fueraDeRango = plantilla && monto > 0 && (
    (minimo > 0 && monto < minimo) || (maximo > 0 && monto > maximo)
  )

  return (
    <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
      <p className="text-[15px] font-bold text-on-background m-0">1. Detalles del préstamo</p>
      <p className="text-[12.5px] text-on-surface-variant mt-1 mb-5">Define las condiciones generales del préstamo.</p>

      <div className="flex flex-col gap-4">
        <div>
          <CampoSelect
            etiqueta="Plantilla de crédito (opcional)"
            placeholder="Sin plantilla / Personalizado"
            valor={plantillaId}
            onChange={onCambiarPlantilla}
            opciones={[{ value: '', label: 'Sin plantilla / Personalizado' }, ...plantillas.map(p => ({ value: p.id, label: p.nombre }))]}
          />
          <p className="text-[11px] text-on-surface-variant mt-1">Selecciona una plantilla para pre-cargar los campos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <CampoMoneda
              etiqueta="Monto del préstamo *"
              valor={detalles.montoInicial === '' ? 0 : Number(detalles.montoInicial)}
              onChange={v => onCambiarDetalle('montoInicial', v)}
            />
            <p className={`text-[11px] mt-1 ${fueraDeRango ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
              {plantilla ? `Rango permitido: ${rangoMontoPlantilla(plantilla.montoMinimo, plantilla.montoMaximo)}` : 'Ingresa el monto a prestar.'}
            </p>
          </div>
          <div>
            <CampoTexto
              etiqueta="Tasa de interés (%) *"
              tipo="number"
              placeholder="0,00"
              valor={detalles.tasaInteres}
              onChange={v => onCambiarDetalle('tasaInteres', v)}
              requerido
            />
            <p className="text-[11px] text-on-surface-variant mt-1">Ej: 5,00 para 5%</p>
          </div>
          <div>
            <CampoTexto
              etiqueta="Número de cuotas *"
              tipo="number"
              placeholder="0"
              valor={detalles.numeroCuotas}
              onChange={v => onCambiarDetalle('numeroCuotas', v)}
              requerido
            />
            <p className="text-[11px] text-on-surface-variant mt-1">Cantidad total de cuotas. 0 = solo intereses (sin plazo fijo).</p>
          </div>
        </div>

        <div className="pt-1 border-t border-outline-variant/40">
          <div className="pt-4">
            <Interruptor
              etiqueta="Redondear cuota al múltiplo de 1.000 más cercano"
              activo={redondearCuotaMil}
              onChange={onCambiarRedondeo}
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              Facilita el manejo de efectivo — el total a pagar y el total de intereses del contrato quedan exactos, solo se redondea lo que se cobra cada período.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <CampoSelect
              etiqueta="Frecuencia de pago *"
              placeholder="Selecciona una frecuencia"
              valor={detalles.frecuenciaPago}
              onChange={v => onCambiarDetalle('frecuenciaPago', v)}
              opciones={FRECUENCIAS}
              requerido
            />
            <p className="text-[11px] text-on-surface-variant mt-1">¿Cada cuánto se realizará el pago?</p>
          </div>
          <div>
            <CampoFecha
              etiqueta="Fecha de inicio *"
              valor={detalles.fechaInicio}
              onChange={v => onCambiarDetalle('fechaInicio', v)}
              requerido
            />
            <p className="text-[11px] text-on-surface-variant mt-1">Fecha desde la cual inicia el préstamo.</p>
          </div>
          <div>
            <CampoFecha
              etiqueta="Fecha de la letra (opcional)"
              valor={detalles.fechaLetra}
              onChange={v => onCambiarDetalle('fechaLetra', v)}
            />
            <p className="text-[11px] text-on-surface-variant mt-1">Puede dejarse vacío y llenarse después.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
