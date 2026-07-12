import { useState } from 'react'
import Modal from './Modal'
import CampoTexto from './CampoTexto'
import CampoMoneda from './CampoMoneda'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoMas, IcoMenos, IcoCheck } from './iconos'
import { formatearPrecio } from '../../lib/formato'
import { abrirVentanaTirilla } from '../../lib/tirillaCapital'

const FORM_INICIAL = { monto: 0, nombreContraparte: '' }

const TIPOS = [
  { tipo: 'AGREGAR', etiqueta: 'Agregar capital', icono: <IcoMas size={18} /> },
  { tipo: 'QUITAR', etiqueta: 'Quitar capital', icono: <IcoMenos size={18} /> },
]

// Modal de tarjetas para agregar/quitar capital de una caja (aporte/retiro manual),
// mismo patrón visual que ModalCrearCapitalSocio. Quitar nunca puede superar
// `capital.disponible` — lo que ya está prestado no se puede retirar (el backend
// vuelve a validar esto, esta es solo la capa de UX). `onAjustar` llama a la API real
// y debe lanzar si falla; recibe { tipo, monto, nombreContraparte }.
export default function ModalAjustarCapital({ capital, onCerrar, onAjustar }) {
  const [tipo, setTipo] = useState('AGREGAR')
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const esAgregar = tipo === 'AGREGAR'
  // Se evalúa en cada render (no solo al enviar) para que el error de "supera lo
  // disponible" aparezca apenas se escribe el monto, y el botón de acción quede
  // deshabilitado hasta que los parámetros sean válidos.
  const excedeDisponible = tipo === 'QUITAR' && Number(form.monto) > Number(capital.disponible)
  const formValido = Number(form.monto) > 0 && form.nombreContraparte.trim().length > 0 && !excedeDisponible

  function actualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function pedirConfirmacion() {
    if (!formValido) return
    setError('')
    setConfirmando(true)
  }

  async function guardar() {
    // Se abre la pestaña ya (en blanco) como primera línea, todavía dentro del
    // gesto de clic del usuario — si se abriera después del await a la API, el
    // navegador ya no lo asocia con una acción del usuario y la bloquea o la deja
    // en blanco. onAjustar la rellena una vez que el comprobante está listo.
    const ventana = abrirVentanaTirilla()
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      await onAjustar({ tipo, monto: Number(form.monto), nombreContraparte: form.nombreContraparte }, ventana)
      onCerrar()
    } catch (err) {
      ventana?.close()
      setError(err.message || 'No se pudo ajustar el capital. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Modal
        titulo="Agregar / disminuir capital"
        subtitulo={`Ajusta el valor de ${capital.nombre}`}
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
                icono={esAgregar ? <IcoMas /> : <IcoMenos />}
                className="flex-1"
              >
                {guardando ? 'Guardando...' : esAgregar ? 'Agregar capital' : 'Quitar capital'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-5">
          {TIPOS.map(t => {
            const seleccionado = tipo === t.tipo
            return (
              <button
                key={t.tipo}
                type="button"
                onClick={() => { setTipo(t.tipo); setError('') }}
                aria-pressed={seleccionado}
                className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-center cursor-pointer transition-colors ${
                  seleccionado
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant bg-surface-lowest hover:bg-surface-default'
                }`}
              >
                {seleccionado && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center">
                    <IcoCheck size={10} />
                  </span>
                )}
                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  seleccionado ? 'bg-primary text-on-primary' : 'bg-surface-default text-on-surface-variant'
                }`}>
                  {t.icono}
                </span>
                <span className="text-[13px] font-semibold text-on-background">{t.etiqueta}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-4">
          <CampoMoneda
            etiqueta="Monto"
            valor={form.monto}
            onChange={v => actualizar('monto', v)}
            error={excedeDisponible ? `Supera el capital disponible (${formatearPrecio(capital.disponible)}).` : undefined}
          />
          <CampoTexto
            etiqueta={esAgregar ? 'Recibido de' : 'Entregado a'}
            placeholder="Ej. María López"
            valor={form.nombreContraparte}
            onChange={v => actualizar('nombreContraparte', v)}
            autoComplete="name"
            requerido
          />
          {tipo === 'QUITAR' && !excedeDisponible && (
            <p className="text-[12px] text-on-surface-variant -mt-1">
              Disponible para retirar: <strong className="text-on-background">{formatearPrecio(capital.disponible)}</strong>
            </p>
          )}
        </div>
      </Modal>

      {confirmando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo={esAgregar ? '¿Agregar este capital?' : '¿Quitar este capital?'}
          mensaje={
            <div className="text-left flex flex-col gap-1">
              <p className="m-0"><strong>Monto:</strong> {formatearPrecio(form.monto)}</p>
              <p className="m-0"><strong>{esAgregar ? 'Recibido de' : 'Entregado a'}:</strong> {form.nombreContraparte}</p>
            </div>
          }
          textoConfirmar={esAgregar ? 'Sí, agregar' : 'Sí, quitar'}
          onConfirmar={guardar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
