import { useState } from 'react'
import Modal from './Modal'
import CampoTexto from './CampoTexto'
import CampoMoneda from './CampoMoneda'
import CampoFecha from './CampoFecha'
import Interruptor from './Interruptor'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoImprimir } from './iconos'
import { formatearPrecio, formatearFechaLocal, fechaHoyISO } from '../../lib/formato'
import { abrirVentanaImprimible } from '../../lib/documentoLetraCambio'

const FORM_INICIAL = {
  incluyeValor: false, valor: 0,
  incluyeBeneficiario: false, beneficiario: '',
  incluyeFecha: false, fechaVencimiento: '',
}

// Modal para generar la letra de cambio de un crédito ya otorgado. El nombre y la
// cédula del deudor SIEMPRE van en el documento (no son opcionales, salen del
// crédito en el backend) — el operador solo decide si incluye o deja en blanco
// el valor, el beneficiario ("a favor de quién") y la fecha de vencimiento.
// Dejar algo en blanco es válido legalmente (Art. 622 C.Co.) solo si se firma
// también la carta de instrucciones, que el backend genera automáticamente.
export default function ModalGenerarLetraCambio({ credito, onCerrar, onGenerar }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  function actualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  const fechaValida = !form.incluyeFecha || (!!form.fechaVencimiento && form.fechaVencimiento >= fechaHoyISO())
  const formValido =
    (!form.incluyeValor || Number(form.valor) > 0) &&
    (!form.incluyeBeneficiario || form.beneficiario.trim().length > 0) &&
    fechaValida

  const camposEnBlanco = [
    !form.incluyeValor && 'el valor',
    !form.incluyeBeneficiario && 'a favor de quién (beneficiario)',
    !form.incluyeFecha && 'la fecha de vencimiento',
  ].filter(Boolean)

  function pedirConfirmacion() {
    if (!formValido) return
    setError('')
    setConfirmando(true)
  }

  async function guardar() {
    // Se abre la pestaña ya (en blanco) como primera línea, dentro del gesto de
    // clic — mismo motivo que ModalAjustarCapital: si se abre después del await
    // a la API, el navegador la bloquea o la deja en blanco.
    const ventana = abrirVentanaImprimible()
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      await onGenerar({
        incluyeValor: form.incluyeValor,
        valor: form.incluyeValor ? Number(form.valor) : undefined,
        incluyeBeneficiario: form.incluyeBeneficiario,
        beneficiario: form.incluyeBeneficiario ? form.beneficiario.trim() : undefined,
        incluyeFecha: form.incluyeFecha,
        fechaVencimiento: form.incluyeFecha ? form.fechaVencimiento : undefined,
      }, ventana)
      onCerrar()
    } catch (err) {
      ventana?.close()
      setError(err.message || 'No se pudo generar la letra de cambio. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Modal
        titulo="Generar letra de cambio"
        subtitulo={`Crédito de ${credito.clienteNombre}`}
        onCerrar={onCerrar}
        ancho="480px"
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
              <BotonAccion
                type="button"
                onClick={pedirConfirmacion}
                disabled={guardando || !formValido}
                cargando={guardando}
                icono={<IcoImprimir />}
                className="flex-1"
              >
                {guardando ? 'Generando...' : 'Generar letra'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-surface-default px-3.5 py-3">
            <p className="text-[11px] text-on-surface-variant m-0 mb-1">Deudor (siempre va en la letra)</p>
            <p className="text-[13.5px] font-bold text-on-background m-0">{credito.clienteNombre}</p>
            <p className="text-[12px] text-on-surface-variant m-0">C.C. {credito.clienteCedula}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Interruptor etiqueta="Incluir valor" activo={form.incluyeValor} onChange={v => actualizar('incluyeValor', v)} />
            {form.incluyeValor && (
              <CampoMoneda valor={form.valor} onChange={v => actualizar('valor', v)} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Interruptor etiqueta="Incluir a favor de quién (beneficiario)" activo={form.incluyeBeneficiario} onChange={v => actualizar('incluyeBeneficiario', v)} />
            {form.incluyeBeneficiario && (
              <CampoTexto placeholder="Ej. GotaPay S.A.S." valor={form.beneficiario} onChange={v => actualizar('beneficiario', v)} maxLength={150} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Interruptor etiqueta="Incluir fecha de vencimiento" activo={form.incluyeFecha} onChange={v => actualizar('incluyeFecha', v)} />
            {form.incluyeFecha && (
              <CampoFecha
                valor={form.fechaVencimiento}
                onChange={v => actualizar('fechaVencimiento', v)}
                min={fechaHoyISO()}
                error={!fechaValida ? 'No puede ser anterior a hoy' : undefined}
              />
            )}
          </div>

          {camposEnBlanco.length > 0 && (
            <p className="text-[12px] text-on-tertiary-container bg-on-tertiary-container/10 rounded-lg px-3 py-2 m-0">
              Quedará en blanco: {camposEnBlanco.join(', ')}. Se imprimirá también la carta de instrucciones para que el deudor autorice completarlos después.
            </p>
          )}
        </div>
      </Modal>

      {confirmando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Generar esta letra de cambio?"
          mensaje={
            <div className="text-left flex flex-col gap-1">
              <p className="m-0"><strong>Deudor:</strong> {credito.clienteNombre} (C.C. {credito.clienteCedula})</p>
              <p className="m-0"><strong>Valor:</strong> {form.incluyeValor ? formatearPrecio(form.valor) : 'En blanco'}</p>
              <p className="m-0"><strong>A favor de:</strong> {form.incluyeBeneficiario ? form.beneficiario : 'En blanco'}</p>
              <p className="m-0"><strong>Vence:</strong> {form.incluyeFecha ? formatearFechaLocal(form.fechaVencimiento) : 'En blanco'}</p>
              {camposEnBlanco.length > 0 && (
                <p className="m-0 mt-1 text-on-surface-variant">Se generará también la carta de instrucciones.</p>
              )}
            </div>
          }
          textoConfirmar="Sí, generar"
          onConfirmar={guardar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
