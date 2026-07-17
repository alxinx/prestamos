import { useEffect, useState } from 'react'
import CampoTexto from '../CampoTexto'
import CampoSelect from '../CampoSelect'
import CampoTextarea from '../CampoTextarea'
import MapaSeleccionUbicacion from '../MapaSeleccionUbicacion'
import { IcoInfo, IcoBasura, IcoPersonas } from '../iconos'
import { geocodificarDireccion } from '../../../lib/geocodificacion'
import { ETIQUETA_TIPO_UBICACION } from '../../../lib/clienteWizardConstantes'

function IcoCasa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}
function IcoMaletin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
function IcoTienda() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 4 4h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    </svg>
  )
}
function IcoDocumento() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
function IcoPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IcoCrosshair() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

const TIPOS_UBICACION = [
  { value: 'RESIDENCIA', label: 'Residencia', icono: <IcoCasa /> },
  { value: 'TRABAJO', label: 'Trabajo', icono: <IcoMaletin /> },
  { value: 'NEGOCIO_PROPIO', label: 'Negocio propio', icono: <IcoTienda /> },
  { value: 'DONDE_SE_FIRMO', label: 'Donde se firmó', icono: <IcoDocumento /> },
  { value: 'FAMILIAR', label: 'Familiar', icono: <IcoPersonas size={15} /> },
  { value: 'OTRO', label: 'Otro', icono: <IcoPin /> },
]
const ICONO_POR_TIPO = Object.fromEntries(TIPOS_UBICACION.map(t => [t.value, t.icono]))
// Las etiquetas de texto viven en clienteWizardConstantes.js (fuente única
// compartida con el modal de confirmación) — acá solo se necesitan los íconos.
const ETIQUETA_POR_TIPO = ETIQUETA_TIPO_UBICACION

// Paso 3 — lista de tarjetas a la izquierda (una por ubicación agregada) +
// formulario de detalle de la ubicación activa + mapa para capturar
// lat/lng. La primera ubicación del arreglo siempre es "Principal" — el
// backend también lo fuerza así, sin importar lo que se mande (nunca se confía
// en el frontend para esa bandera).
export default function Paso3Ubicaciones({ ubicaciones, indiceActivo, onSeleccionar, onAgregar, onEliminar, onActualizarActiva }) {
  const activa = ubicaciones[indiceActivo]
  const [geocodificando, setGeocodificando] = useState(false)

  // Geocodifica automáticamente dirección + barrio + ciudad (debounced, vía
  // Nominatim/OpenStreetMap) para ubicar el pin sin que el usuario tenga que
  // hacer clic o arrastrar manualmente. `indiceActivo` va en las dependencias
  // para que cambiar de tarjeta cancele cualquier geocodificación pendiente de
  // la anterior en vez de escribirle el resultado a la tarjeta equivocada.
  useEffect(() => {
    if (!activa) return
    const direccion = activa.direccion.trim()
    const ciudad = activa.ciudad.trim()
    if (!direccion || !ciudad) { setGeocodificando(false); return }

    setGeocodificando(true)
    let vigente = true

    const idTimeout = setTimeout(async () => {
      const resultado = await geocodificarDireccion({ direccion, barrio: activa.barrio, ciudad })
      if (!vigente) return
      setGeocodificando(false)
      if (resultado) {
        onActualizarActiva('latitud', resultado.latitud)
        onActualizarActiva('longitud', resultado.longitud)
      }
    }, 900)

    return () => { vigente = false; clearTimeout(idTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa?.direccion, activa?.barrio, activa?.ciudad, indiceActivo])

  function capturarMiUbicacion() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        onActualizarActiva('latitud', Number(pos.coords.latitude.toFixed(6)))
        onActualizarActiva('longitud', Number(pos.coords.longitude.toFixed(6)))
      },
      () => {},
    )
  }

  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 className="text-[15px] font-bold text-on-background m-0">Ubicaciones — UbicacionCliente</h2>
        <span className="text-on-surface-variant/50"><IcoInfo /></span>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-5">Registra al menos una ubicación donde se pueda localizar al cliente.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-5 items-start">

        {/* Lista de ubicaciones */}
        <div className="flex flex-col gap-2.5">
          {ubicaciones.map((u, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSeleccionar(i)}
              className={`relative text-left p-3.5 rounded-xl border-2 transition-colors cursor-pointer ${
                i === indiceActivo ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-lowest hover:bg-surface-default'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-on-surface-variant shrink-0">{ICONO_POR_TIPO[u.tipo]}</span>
                <span className="text-[13px] font-semibold text-on-background truncate">{ETIQUETA_POR_TIPO[u.tipo]}</span>
                {i === 0 && (
                  <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container/25 text-on-secondary-container">
                    Principal
                  </span>
                )}
                {ubicaciones.length > 1 && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onEliminar(i) }}
                    aria-label="Eliminar ubicación"
                    className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <IcoBasura size={13} />
                  </button>
                )}
              </div>
              <p className="text-[12px] text-on-surface-variant m-0 truncate">{u.direccion || 'Sin dirección'}</p>
              {(u.barrio || u.ciudad) && (
                <p className="text-[12px] text-on-surface-variant m-0 truncate">{[u.barrio, u.ciudad].filter(Boolean).join(', ')}</p>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={onAgregar}
            className="py-2.5 rounded-xl border-2 border-dashed border-secondary/40 text-secondary text-[13px] font-semibold cursor-pointer hover:bg-secondary-container/10 transition-colors"
          >
            + Agregar otra ubicación
          </button>

          <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
            La primera ubicación se marca como principal. Puedes agregar todas las ubicaciones necesarias.
          </p>
        </div>

        {/* Formulario de detalle */}
        {activa && (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-on-surface-variant m-0">Detalles de la ubicación</p>
                <span className="text-[11px] font-semibold text-secondary">{ETIQUETA_POR_TIPO[activa.tipo]}</span>
              </div>

              <CampoSelect
                etiqueta="Tipo *"
                valor={activa.tipo}
                onChange={v => onActualizarActiva('tipo', v)}
                opciones={TIPOS_UBICACION.map(t => ({ value: t.value, label: t.label }))}
              />
              <CampoTexto
                etiqueta="Dirección *"
                valor={activa.direccion}
                onChange={v => onActualizarActiva('direccion', v)}
                placeholder="Ej. Cra 45 # 32-15"
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoTexto etiqueta="Ciudad *" valor={activa.ciudad} onChange={v => onActualizarActiva('ciudad', v)} placeholder="Ej. Medellín" />
                <div>
                  <CampoTexto etiqueta="Barrio (opcional)" valor={activa.barrio} onChange={v => onActualizarActiva('barrio', v)} placeholder="Ej. Belén La Palma" />
                  <p className="text-[11px] text-on-surface-variant mt-1">Ayuda a ubicar el pin correcto — hay calles con el mismo nombre en varios barrios.</p>
                </div>
              </div>
              <CampoTextarea
                etiqueta="Referencia (cómo llegar, opcional)"
                valor={activa.referencia}
                onChange={v => onActualizarActiva('referencia', v)}
                placeholder="Ej. A media cuadra de la iglesia, casa blanca con rejas negras."
                filas={2}
              />
              <CampoTexto
                etiqueta="Horario en que se le encuentra (opcional)"
                valor={activa.horarioUbicacion}
                onChange={v => onActualizarActiva('horarioUbicacion', v)}
                placeholder="Ej. Lunes a viernes: 6:00 p.m. – 9:00 p.m."
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-on-surface-variant">Ubicación en el mapa</label>
                  {geocodificando ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
                      <span className="w-3 h-3 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
                      Ubicando dirección...
                    </span>
                  ) : activa.latitud != null && (
                    <span className="text-[11px] font-semibold text-secondary">Ubicación capturada</span>
                  )}
                </div>
                {activa.latitud != null && (
                  <p className="text-[11.5px] text-on-surface-variant mb-2">
                    Latitud: {activa.latitud}, Longitud: {activa.longitud}
                  </p>
                )}
                <button
                  type="button"
                  onClick={capturarMiUbicacion}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-secondary/40 text-secondary text-[12.5px] font-semibold hover:bg-secondary-container/10 transition-colors"
                >
                  <IcoCrosshair /> Capturar mi ubicación
                </button>
                <p className="text-[11px] text-on-surface-variant/80 mt-2 leading-relaxed">
                  La ubicación automática es solo un punto de partida — verifica que el pin quede en el lugar
                  correcto y arrástralo para ajustarlo si es necesario.
                </p>
              </div>
            </div>

            <MapaSeleccionUbicacion
              latitud={activa.latitud}
              longitud={activa.longitud}
              onCambiar={(lat, lng) => { onActualizarActiva('latitud', lat); onActualizarActiva('longitud', lng) }}
            />
          </>
        )}
      </div>
    </div>
  )
}
