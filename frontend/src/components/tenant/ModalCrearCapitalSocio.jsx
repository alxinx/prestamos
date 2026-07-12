import { useState } from 'react'
import Modal from './Modal'
import CampoTexto from './CampoTexto'
import CampoMoneda from './CampoMoneda'
import CampoSelect from './CampoSelect'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoMas, IcoCorreo, IcoEdificio, IcoPersonas, IcoCheck } from './iconos'
import { formatearPrecio } from '../../lib/formato'
import { abrirVentanaTirilla } from '../../lib/tirillaCapital'

const FORM_CAPITAL_INICIAL = { nombre: '', valorTotal: 0, socioId: '' }
const FORM_SOCIO_INICIAL = { nombreCompleto: '', cedula: '', telefono: '', email: '' }

const TIPOS = [
  { esSocio: false, etiqueta: 'Capital', icono: <IcoEdificio size={18} /> },
  { esSocio: true, etiqueta: 'Socio', icono: <IcoPersonas size={18} /> },
]

// Modal de creación DRY para Capital y Socio — comparten el mismo shell (Modal) y
// solo cambia el formulario interior según la tarjeta seleccionada arriba (más
// intuitivo que un switch para elegir entre dos tipos). Por defecto abre el
// formulario de capital. Antes de guardar siempre se confirma con un resumen de
// los datos ingresados (ModalConfirmacion). `onCrearCapital`/`onCrearSocio` llaman
// a la API real y deben lanzar si falla.
export default function ModalCrearCapitalSocio({ socios, onCerrar, onCrearCapital, onCrearSocio }) {
  const [esSocio, setEsSocio] = useState(false)
  const [formCapital, setFormCapital] = useState(FORM_CAPITAL_INICIAL)
  const [formSocio, setFormSocio] = useState(FORM_SOCIO_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  function actualizarCapital(campo, valor) {
    setFormCapital(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function actualizarSocio(campo, valor) {
    setFormSocio(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function validar() {
    if (esSocio) {
      if (!formSocio.nombreCompleto.trim() || !formSocio.cedula.trim() || !formSocio.telefono.trim() || !formSocio.email.trim()) {
        return 'Completa todos los campos requeridos.'
      }
      return null
    }
    if (!formCapital.nombre.trim() || !formCapital.valorTotal || !formCapital.socioId) {
      return 'Completa todos los campos requeridos.'
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
    // La tirilla se abre en blanco ya, todavía dentro del gesto de clic del usuario
    // (antes del await a la API) — si se abriera después, el navegador ya no lo
    // asocia con una acción del usuario y la bloquea o la deja en blanco. Solo
    // aplica al crear capital: un socio no genera comprobante.
    const ventana = esSocio ? null : abrirVentanaTirilla()
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      if (esSocio) {
        await onCrearSocio(formSocio)
      } else {
        await onCrearCapital(formCapital, ventana)
      }
      onCerrar()
    } catch (err) {
      ventana?.close()
      setError(err.message || `No se pudo crear ${esSocio ? 'el socio' : 'el capital'}. Intenta nuevamente.`)
    } finally {
      setGuardando(false)
    }
  }

  const socioSeleccionado = socios.find(s => s.id === formCapital.socioId)

  return (
    <>
      <Modal
        titulo={esSocio ? 'Crear socio' : 'Crear capital'}
        subtitulo={esSocio ? 'Registra un nuevo socio de la empresa' : 'Registra una nueva fuente de capital'}
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
                disabled={guardando}
                cargando={guardando}
                icono={<IcoMas />}
                className="flex-1"
              >
                {guardando ? 'Guardando...' : esSocio ? 'Crear socio' : 'Crear capital'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-5">
          {TIPOS.map(tipo => {
            const seleccionado = esSocio === tipo.esSocio
            return (
              <button
                key={tipo.etiqueta}
                type="button"
                onClick={() => setEsSocio(tipo.esSocio)}
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
                  {tipo.icono}
                </span>
                <span className="text-[13px] font-semibold text-on-background">{tipo.etiqueta}</span>
              </button>
            )
          })}
        </div>

        {esSocio ? (
          <div className="flex flex-col gap-4">
            <CampoTexto
              etiqueta="Nombre completo"
              placeholder="Ej. María López"
              valor={formSocio.nombreCompleto}
              onChange={v => actualizarSocio('nombreCompleto', v)}
              autoComplete="name"
              requerido
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto
                etiqueta="Cédula"
                placeholder="Ej. 1020304050"
                valor={formSocio.cedula}
                onChange={v => actualizarSocio('cedula', v)}
                requerido
              />
              <CampoTexto
                etiqueta="Teléfono"
                placeholder="Ej. 3001234567"
                valor={formSocio.telefono}
                onChange={v => actualizarSocio('telefono', v)}
                autoComplete="tel"
                requerido
              />
            </div>
            <CampoTexto
              etiqueta="Correo electrónico"
              tipo="email"
              icono={<IcoCorreo />}
              placeholder="socio@correo.com"
              valor={formSocio.email}
              onChange={v => actualizarSocio('email', v)}
              autoComplete="email"
              requerido
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CampoTexto
              etiqueta="Nombre del capital"
              placeholder="Ej. Capital Principal"
              valor={formCapital.nombre}
              onChange={v => actualizarCapital('nombre', v)}
              requerido
            />
            <CampoMoneda
              etiqueta="Valor del capital"
              valor={formCapital.valorTotal}
              onChange={v => actualizarCapital('valorTotal', v)}
            />
            <CampoSelect
              etiqueta="Socio del capital"
              placeholder="Selecciona un socio"
              valor={formCapital.socioId}
              onChange={v => actualizarCapital('socioId', v)}
              opciones={socios.map(s => ({ value: s.id, label: s.nombre }))}
              requerido
            />
          </div>
        )}
      </Modal>

      {confirmando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo={esSocio ? '¿Crear este socio?' : '¿Crear este capital?'}
          mensaje={
            esSocio ? (
              <div className="text-left flex flex-col gap-1">
                <p className="m-0"><strong>Nombre:</strong> {formSocio.nombreCompleto}</p>
                <p className="m-0"><strong>Cédula:</strong> {formSocio.cedula}</p>
                <p className="m-0"><strong>Teléfono:</strong> {formSocio.telefono}</p>
                <p className="m-0"><strong>Correo:</strong> {formSocio.email}</p>
              </div>
            ) : (
              <div className="text-left flex flex-col gap-1">
                <p className="m-0"><strong>Nombre:</strong> {formCapital.nombre}</p>
                <p className="m-0"><strong>Valor:</strong> {formatearPrecio(formCapital.valorTotal)}</p>
                <p className="m-0"><strong>Socio:</strong> {socioSeleccionado?.nombre ?? '—'}</p>
              </div>
            )
          }
          textoConfirmar="Sí, crear"
          onConfirmar={guardar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
