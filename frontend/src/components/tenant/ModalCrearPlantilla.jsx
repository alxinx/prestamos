import { useState } from 'react'
import Modal from './Modal'
import CampoTexto from './CampoTexto'
import CampoMoneda from './CampoMoneda'
import CampoSelect from './CampoSelect'
import Interruptor from './Interruptor'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoMas } from './iconos'
import {
  OPCIONES_FRECUENCIA_PAGO, ETIQUETA_FRECUENCIA_PAGO,
  OPCIONES_BASE_CALCULO_MORA, ETIQUETA_BASE_CALCULO_MORA,
  rangoMontoPlantilla, textoCuotasPlantilla,
} from '../../lib/plantillaCreditoFormato'

const FORM_INICIAL = {
  nombre: '', plazo: '', tasaInteres: '', numeroCuotas: '', frecuenciaPago: 'DIARIO',
  montoMinimo: 0, montoMaximo: 0,
  interesMoraActivo: false, porcentajeMora: '', baseCalculoMora: 'INTERES', diasGraciaMora: '0',
}

// Modal de creación de plantilla de crédito ("plantilla de intereses") — define
// las condiciones (tasa, plazo, cuotas, rango de monto, interés por mora) con las
// que se otorgan los préstamos que usen esta plantilla. `onCrear` llama a la API
// real y debe lanzar si falla (mismo contrato que ModalCrearCapitalSocio).
//
// Antes de guardar siempre se confirma con un resumen de los datos ingresados
// (ModalConfirmacion) — ninguna acción de "crear" se dispara directo al primer
// clic, sin importar si es reversible o no (decisión 2026-07-16).
//
// Convenciones de "sin límite" (decisión 2026-07-16, iguales en backend):
// - montoMinimo/montoMaximo en 0 = sin límite (nunca negativo).
// - numeroCuotas en 0 = cuotas indefinidas.
export default function ModalCrearPlantilla({ onCerrar, onCrear }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  function actualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function validar() {
    if (!form.nombre.trim()) return 'El nombre es requerido.'
    if (!form.plazo || Number(form.plazo) <= 0) return 'El plazo debe ser mayor a 0.'
    if (!form.tasaInteres || Number(form.tasaInteres) <= 0) return 'La tasa de interés debe ser mayor a 0.'
    if (form.numeroCuotas === '' || Number(form.numeroCuotas) < 0) return 'El número de cuotas no puede ser negativo (0 = indefinidas).'
    if (Number(form.montoMinimo) < 0 || Number(form.montoMaximo) < 0) return 'Los montos no pueden ser negativos.'
    if (Number(form.montoMaximo) > 0 && Number(form.montoMaximo) < Number(form.montoMinimo)) {
      return 'El monto máximo debe ser mayor o igual al mínimo (o 0 para indicar sin límite).'
    }
    if (form.interesMoraActivo && (!form.porcentajeMora || Number(form.porcentajeMora) <= 0)) {
      return 'El % de mora debe ser mayor a 0.'
    }
    if (form.interesMoraActivo && (form.diasGraciaMora === '' || Number(form.diasGraciaMora) < 0)) {
      return 'Los días de gracia no pueden ser negativos.'
    }
    return null
  }

  function pedirConfirmacion() {
    const errorValidacion = validar()
    if (errorValidacion) { setError(errorValidacion); return }
    setError('')
    setConfirmando(true)
  }

  async function guardar() {
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      await onCrear({
        nombre: form.nombre.trim(),
        plazo: Number(form.plazo),
        tasaInteres: Number(form.tasaInteres),
        numeroCuotas: Number(form.numeroCuotas),
        frecuenciaPago: form.frecuenciaPago,
        montoMinimo: Number(form.montoMinimo),
        montoMaximo: Number(form.montoMaximo),
        interesMoraActivo: form.interesMoraActivo,
        porcentajeMora: form.interesMoraActivo ? Number(form.porcentajeMora) : null,
        baseCalculoMora: form.interesMoraActivo ? form.baseCalculoMora : null,
        diasGraciaMora: Number(form.diasGraciaMora || 0),
      })
      onCerrar()
    } catch (err) {
      setError(err.message || 'No se pudo crear la plantilla. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Modal
        titulo="Crear plantilla de intereses"
        subtitulo="Define las condiciones con las que se otorgarán los préstamos que usen esta plantilla."
        onCerrar={onCerrar}
        ancho="620px"
        footer={
          <>
            {error && (
              <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer hover:bg-surface-high transition-colors"
              >
                Cancelar
              </button>
              <BotonAccion type="button" onClick={pedirConfirmacion} disabled={guardando} cargando={guardando} icono={<IcoMas />} className="flex-1">
                {guardando ? 'Guardando...' : 'Crear plantilla'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <CampoTexto
            etiqueta="Nombre de la plantilla"
            placeholder="Ej. Crédito diario 30 días"
            valor={form.nombre}
            onChange={v => actualizar('nombre', v)}
            requerido
          />
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto etiqueta="Plazo (días)" tipo="number" placeholder="Ej. 30" valor={form.plazo} onChange={v => actualizar('plazo', v)} requerido />
            <CampoTexto etiqueta="Tasa de interés (%)" tipo="number" placeholder="Ej. 20" valor={form.tasaInteres} onChange={v => actualizar('tasaInteres', v)} requerido />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CampoTexto etiqueta="Número de cuotas" tipo="number" placeholder="Ej. 30" valor={form.numeroCuotas} onChange={v => actualizar('numeroCuotas', v)} requerido />
              <p className="text-[11px] text-on-surface-variant mt-1">0 = cuotas indefinidas</p>
            </div>
            <CampoSelect etiqueta="Frecuencia de pago" valor={form.frecuenciaPago} onChange={v => actualizar('frecuenciaPago', v)} opciones={OPCIONES_FRECUENCIA_PAGO} />
          </div>
          <div>
            <div className="grid grid-cols-2 gap-3">
              <CampoMoneda etiqueta="Monto mínimo" valor={form.montoMinimo} onChange={v => actualizar('montoMinimo', v)} />
              <CampoMoneda etiqueta="Monto máximo" valor={form.montoMaximo} onChange={v => actualizar('montoMaximo', v)} />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">0 en cualquiera de los dos = sin límite</p>
          </div>

          <div className="pt-1 border-t border-outline-variant/40">
            <div className="pt-4">
              <Interruptor
                etiqueta="Cobrar interés por mora"
                activo={form.interesMoraActivo}
                onChange={v => actualizar('interesMoraActivo', v)}
              />
            </div>

            {form.interesMoraActivo && (
              <div className="grid grid-cols-3 gap-3 mt-4 items-start">
                <CampoTexto
                  etiqueta="% de mora"
                  tipo="number"
                  placeholder="Ej. 5"
                  valor={form.porcentajeMora}
                  onChange={v => actualizar('porcentajeMora', v)}
                  requerido
                />
                <CampoSelect
                  etiqueta="Se calcula..."
                  valor={form.baseCalculoMora}
                  onChange={v => actualizar('baseCalculoMora', v)}
                  opciones={OPCIONES_BASE_CALCULO_MORA}
                />
                <div>
                  <CampoTexto
                    etiqueta="Días de gracia"
                    tipo="number"
                    placeholder="Ej. 3"
                    valor={form.diasGraciaMora}
                    onChange={v => actualizar('diasGraciaMora', v)}
                    requerido
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">Días de atraso tolerados antes de cobrar mora</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {confirmando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Crear esta plantilla?"
          mensaje={
            <div className="text-left flex flex-col gap-1">
              <p className="m-0"><strong>Nombre:</strong> {form.nombre}</p>
              <p className="m-0"><strong>Tasa de interés:</strong> {form.tasaInteres}%</p>
              <p className="m-0"><strong>Plazo:</strong> {form.plazo} días</p>
              <p className="m-0"><strong>Cuotas:</strong> {textoCuotasPlantilla(form.numeroCuotas)} ({ETIQUETA_FRECUENCIA_PAGO[form.frecuenciaPago]})</p>
              <p className="m-0"><strong>Monto permitido:</strong> {rangoMontoPlantilla(form.montoMinimo, form.montoMaximo)}</p>
              <p className="m-0">
                <strong>Interés por mora:</strong>{' '}
                {form.interesMoraActivo
                  ? `${form.porcentajeMora}% ${ETIQUETA_BASE_CALCULO_MORA[form.baseCalculoMora].toLowerCase()}, ${form.diasGraciaMora} día(s) de gracia`
                  : 'No aplica'}
              </p>
            </div>
          }
          textoConfirmar="Sí, crear"
          onConfirmar={guardar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
