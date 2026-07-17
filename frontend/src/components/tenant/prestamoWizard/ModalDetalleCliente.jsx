import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ChipEstado from '../ChipEstado'
import Estrellas from '../Estrellas'
import FilaConsentimiento from '../FilaConsentimiento'
import { IcoX, IcoPersonas, IcoCheck } from '../iconos'
import { formatearFechaLocal } from '../../../lib/formato'
import { ETIQUETA_TIPO_UBICACION, ETIQUETA_RELACION } from '../../../lib/clienteWizardConstantes'
import { apiFetch } from '../../../lib/api'

function IcoCasa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function Tarjeta({ titulo, icono, children }) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-lowest p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-3 flex items-center gap-1.5">
        {icono} {titulo}
      </p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12px] text-on-surface-variant shrink-0">{etiqueta}</span>
      <span className="text-[13px] font-semibold text-on-background text-right">{valor ?? '—'}</span>
    </div>
  )
}

// Modal "Ver datos" — muestra el perfil completo de un cliente ya registrado,
// separado en tarjetas (datos personales, operativa, ubicaciones, referencias,
// consentimientos) para que el operador lo revise de un vistazo antes de
// otorgarle un préstamo. Solo lectura — nunca expone documentos con ruta
// directa de R2 (CLAUDE.md §9), este modal no los muestra.
export default function ModalDetalleCliente({ clienteId, onCerrar }) {
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    apiFetch(`/api/tenant/clientes/${clienteId}`).then(({ ok, datos }) => {
      if (!vigente) return
      if (!ok) { setError(datos.error || 'No se pudo cargar el cliente.'); setCargando(false); return }
      setDetalle(datos)
      setCargando(false)
    })
    return () => { vigente = false }
  }, [clienteId])

  useEffect(() => {
    const cerrarEsc = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', cerrarEsc)
    return () => document.removeEventListener('keydown', cerrarEsc)
  }, [onCerrar])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar() }}
      className="fixed inset-0 z-[300] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[560px] max-h-[85vh] bg-surface-lowest rounded-2xl shadow-card-hover flex flex-col overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="px-6 py-4 border-b border-outline-variant/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
              <IcoPersonas size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-on-background m-0">{detalle?.nombreCompleto || 'Datos del cliente'}</h2>
              {detalle && <p className="text-[12px] text-on-surface-variant m-0">CC {detalle.cedula}</p>}
            </div>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-default border-none text-on-surface-variant cursor-pointer hover:bg-surface-high transition-colors shrink-0"
          >
            <IcoX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cargando ? (
            <p className="text-[13px] text-on-surface-variant">Cargando datos del cliente...</p>
          ) : error ? (
            <p className="text-[13px] text-error">{error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Tarjeta titulo="Datos personales" icono={<IcoPersonas size={13} />}>
                <Dato etiqueta="Nombre completo" valor={detalle.nombreCompleto} />
                <Dato etiqueta="Cédula" valor={detalle.cedula} />
                <Dato etiqueta="Teléfono" valor={detalle.telefono} />
                <Dato etiqueta="Fecha de nacimiento" valor={detalle.fechaNacimiento ? formatearFechaLocal(detalle.fechaNacimiento) : 'Sin registrar'} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-on-surface-variant">Estado</span>
                  <ChipEstado estado={detalle.estado} />
                </div>
              </Tarjeta>

              <Tarjeta titulo="Información operativa" icono={<IcoCasa />}>
                <Dato etiqueta="Zona de cobertura" valor={detalle.zona?.nombre || 'Sin asignar'} />
                <Dato etiqueta="Cobrador asignado" valor={detalle.cobrador?.nombreCompleto || 'Sin asignar'} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-on-surface-variant">Calificación</span>
                  <Estrellas calificacion={detalle.calificacion} />
                </div>
                <Dato etiqueta="Cliente desde" valor={formatearFechaLocal(detalle.createdAt)} />
                {detalle.observaciones && (
                  <div>
                    <p className="text-[12px] text-on-surface-variant m-0 mb-1">Observaciones</p>
                    <p className="text-[12.5px] text-on-background m-0">{detalle.observaciones}</p>
                  </div>
                )}
              </Tarjeta>

              <Tarjeta titulo={`Ubicaciones (${detalle.ubicaciones.length})`} icono={<IcoCasa />}>
                {detalle.ubicaciones.length === 0 ? (
                  <p className="text-[12.5px] text-on-surface-variant m-0">Sin ubicaciones registradas.</p>
                ) : (
                  detalle.ubicaciones.map(u => (
                    <div key={u.id} className="text-[12.5px] pb-2 border-b border-outline-variant/30 last:border-0 last:pb-0">
                      <span className="font-semibold text-on-background">{ETIQUETA_TIPO_UBICACION[u.tipo] ?? u.tipo}</span>
                      {u.esPrincipal && <span className="ml-1.5 text-[10.5px] font-semibold text-secondary">Principal</span>}
                      <p className="text-on-surface-variant m-0 mt-0.5">
                        {[u.direccion, u.barrio, u.ciudad].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </Tarjeta>

              <Tarjeta titulo={`Referencias personales (${detalle.referencias.length})`} icono={<IcoPersonas size={13} />}>
                {detalle.referencias.length === 0 ? (
                  <p className="text-[12.5px] text-on-surface-variant m-0">Sin referencias registradas.</p>
                ) : (
                  detalle.referencias.map(r => (
                    <div key={r.id} className="text-[12.5px]">
                      <span className="font-semibold text-on-background">{r.nombreCompleto}</span>
                      <span className="ml-1.5 text-on-surface-variant">
                        {r.telefono} · {ETIQUETA_RELACION[r.relacionConCliente] ?? r.relacionConCliente}
                      </span>
                    </div>
                  ))
                )}
              </Tarjeta>

              <div className="sm:col-span-2">
                <Tarjeta titulo="Consentimientos" icono={<IcoCheck size={13} />}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <FilaConsentimiento etiqueta="Tratamiento de datos" marcado={detalle.consentimientos.tratamientoDatos} />
                    <FilaConsentimiento etiqueta="Compartir score" marcado={detalle.consentimientos.compartirScore} />
                    <FilaConsentimiento etiqueta="Notificaciones WhatsApp" marcado={detalle.consentimientos.notificacionesWsp} />
                  </div>
                </Tarjeta>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
