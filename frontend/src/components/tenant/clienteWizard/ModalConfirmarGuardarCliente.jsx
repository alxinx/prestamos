import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IcoCheck, IcoX } from '../iconos'
import { formatearFecha } from '../../../lib/formato'
import { ETIQUETA_TIPO_UBICACION, ETIQUETA_RELACION } from '../../../lib/clienteWizardConstantes'

function Seccion({ titulo, children }) {
  return (
    <div className="py-4 border-b border-outline-variant/40 last:border-b-0">
      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-2.5">{titulo}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Fila({ etiqueta, valor }) {
  if (!valor) return null
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12.5px] text-on-surface-variant shrink-0">{etiqueta}</span>
      <span className="text-[13px] font-semibold text-on-background text-right">{valor}</span>
    </div>
  )
}

function Consentimiento({ etiqueta, marcado }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12.5px] text-on-surface-variant">{etiqueta}</span>
      <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${marcado ? 'text-secondary' : 'text-on-surface-variant/70'}`}>
        {marcado ? <IcoCheck size={12} /> : <IcoX size={12} />} {marcado ? 'Sí' : 'No'}
      </span>
    </div>
  )
}

// Modal final del wizard de clientes — muestra un resumen de todo lo capturado
// para que el usuario lo revise antes de guardar, y ofrece 3 salidas distintas
// (no 2, como ModalConfirmacion): corregir (vuelve al wizard sin guardar),
// guardar, o guardar y saltar directo al formulario de préstamo con este
// cliente precargado.
export default function ModalConfirmarGuardarCliente({ datos, guardando, onCorregir, onGuardar, onGuardarYCrearPrestamo }) {
  useEffect(() => {
    const cerrar = e => { if (e.key === 'Escape' && !guardando) onCorregir() }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [onCorregir, guardando])

  const {
    cedula, nombreCompleto, telefono, fechaNacimiento,
    zona, cobrador, observaciones,
    ubicaciones = [], referencias = [], consentimientos,
  } = datos

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget && !guardando) onCorregir() }}
      className="fixed inset-0 z-[300] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[480px] max-h-[85vh] bg-surface-lowest rounded-2xl shadow-card-hover flex flex-col overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center shrink-0">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-secondary-container/25 text-secondary">
            <IcoCheck size={26} />
          </div>
          <h2 className="text-[16px] font-bold text-on-background m-0 mb-2">¿Confirmas los datos de {nombreCompleto}?</h2>
          <p className="text-[13px] text-on-surface-variant m-0 leading-relaxed">
            Revisa que la información sea correcta antes de guardar — podrás corregir cualquier paso del formulario.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <Seccion titulo="Datos personales">
            <Fila etiqueta="Cédula" valor={cedula} />
            <Fila etiqueta="Nombre completo" valor={nombreCompleto} />
            <Fila etiqueta="Teléfono" valor={telefono} />
            <Fila etiqueta="Fecha de nacimiento" valor={fechaNacimiento ? formatearFecha(fechaNacimiento) : null} />
          </Seccion>

          <Seccion titulo="Información operativa">
            <Fila etiqueta="Zona de cobertura" valor={zona ?? 'Sin asignar'} />
            <Fila etiqueta="Cobrador asignado" valor={cobrador ?? 'Sin asignar'} />
            <Fila etiqueta="Observaciones" valor={observaciones} />
          </Seccion>

          <Seccion titulo={`Ubicaciones (${ubicaciones.length})`}>
            {ubicaciones.map((u, i) => (
              <div key={i} className="text-[12.5px]">
                <span className="font-semibold text-on-background">{ETIQUETA_TIPO_UBICACION[u.tipo] ?? u.tipo}</span>
                {i === 0 && <span className="ml-1.5 text-[10.5px] font-semibold text-secondary">Principal</span>}
                <p className="text-on-surface-variant m-0 mt-0.5">
                  {[u.direccion, u.barrio, u.ciudad].filter(Boolean).join(', ')}
                </p>
              </div>
            ))}
          </Seccion>

          {referencias.length > 0 && (
            <Seccion titulo={`Referencias personales (${referencias.length})`}>
              {referencias.map((r, i) => (
                <div key={i} className="text-[12.5px]">
                  <span className="font-semibold text-on-background">{r.nombreCompleto}</span>
                  <span className="ml-1.5 text-on-surface-variant">
                    {r.telefono} · {ETIQUETA_RELACION[r.relacionConCliente] ?? r.relacionConCliente}
                  </span>
                </div>
              ))}
            </Seccion>
          )}

          <Seccion titulo="Consentimientos">
            <Consentimiento etiqueta="Tratamiento de datos" marcado={consentimientos.tratamientoDatos} />
            <Consentimiento etiqueta="Compartir score entre tenants" marcado={consentimientos.compartirScore} />
            <Consentimiento etiqueta="Notificaciones por WhatsApp" marcado={consentimientos.notificacionesWsp} />
          </Seccion>
        </div>

        <div className="px-6 py-5 flex flex-col gap-2.5 shrink-0 border-t border-outline-variant/40">
          <button
            onClick={onGuardarYCrearPrestamo}
            disabled={guardando}
            className="py-3 rounded-lg bg-secondary-container text-primary text-[13.5px] font-bold cursor-pointer font-sans transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
          >
            {guardando ? 'Guardando...' : 'Guardar y crear préstamo →'}
          </button>
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="py-3 rounded-lg bg-primary text-on-primary text-[13.5px] font-bold cursor-pointer font-sans transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-125"
          >
            {guardando ? 'Guardando...' : 'Guardar cliente'}
          </button>
          <button
            onClick={onCorregir}
            disabled={guardando}
            className="py-2.5 rounded-lg bg-transparent border-none text-on-surface-variant text-[13px] font-medium cursor-pointer font-sans transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:text-on-background"
          >
            Corregir dato
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
