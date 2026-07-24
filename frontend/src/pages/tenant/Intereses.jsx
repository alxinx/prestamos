import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import BotonAccion from '../../components/tenant/BotonAccion'
import ConPermiso from '../../components/tenant/ConPermiso'
import ModalCrearPlantilla from '../../components/tenant/ModalCrearPlantilla'
import ModalEditarPlantilla from '../../components/tenant/ModalEditarPlantilla'
import { IcoMas, IcoMoneda, IcoAlerta, IcoEditar } from '../../components/tenant/iconos'
import { ETIQUETA_FRECUENCIA_PAGO, rangoMontoPlantilla, textoCuotasPlantilla } from '../../lib/plantillaCreditoFormato'
import { apiFetch } from '../../lib/api'

// Chip de estado propio de esta página — ChipEstado.jsx ya usa la clave INACTIVA
// para EstadoCaja con la etiqueta "Suspendido" (correcto para un capital, pero
// engañoso para una plantilla: acá "inactiva" solo significa que no se usa para
// nuevos préstamos, no que fue suspendida). Mismo estilo visual, etiqueta propia.
function ChipEstadoPlantilla({ estado }) {
  const activa = estado === 'ACTIVA'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
      activa ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-outline-variant/30 text-on-surface-variant'
    }`}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

// Fila de la tarjeta "Plantillas con más mora" — barra horizontal, la más crítica
// (>=30% de sus préstamos en mora) resaltada en rojo. Ordenadas por el backend
// de mayor a menor % de mora.
function FilaMora({ nombre, porcentajeMora, totalCreditos, creditosEnMora }) {
  const critico = porcentajeMora >= 30
  return (
    <div className="py-3 border-b border-outline-variant/40 last:border-0">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-[13px] font-semibold text-on-background truncate">{nombre}</span>
        <span className={`text-[13px] font-bold shrink-0 ${critico ? 'text-error' : 'text-on-background'}`}>{porcentajeMora}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-outline-variant/30 overflow-hidden">
        <div className={`h-full rounded-full ${critico ? 'bg-error' : 'bg-secondary'}`} style={{ width: `${Math.min(100, porcentajeMora)}%` }} />
      </div>
      <p className="text-[11px] text-on-surface-variant mt-1 m-0">
        {creditosEnMora} en mora de {totalCreditos} préstamo{totalCreditos !== 1 ? 's' : ''} otorgados
      </p>
    </div>
  )
}

export default function Intereses() {
  const [plantillas, setPlantillas] = useState([])
  const [cargandoPlantillas, setCargandoPlantillas] = useState(true)
  const [mora, setMora] = useState([])
  const [cargandoMora, setCargandoMora] = useState(true)
  const [mostrandoModal, setMostrandoModal] = useState(false)
  const [plantillaEditando, setPlantillaEditando] = useState(null)
  const [sinPermiso, setSinPermiso] = useState(false)

  async function cargarPlantillas() {
    setCargandoPlantillas(true)
    const { ok, status, datos } = await apiFetch('/api/tenant/plantillas-credito')
    if (status === 403) { setSinPermiso(true); setCargandoPlantillas(false); return }
    if (ok) setPlantillas(datos.plantillas || [])
    setCargandoPlantillas(false)
  }

  async function cargarMora() {
    setCargandoMora(true)
    const { ok, status, datos } = await apiFetch('/api/tenant/plantillas-credito/mora')
    if (status === 403) { setSinPermiso(true); setCargandoMora(false); return }
    if (ok) setMora(datos.plantillas || [])
    setCargandoMora(false)
  }

  useEffect(() => { cargarPlantillas(); cargarMora() }, [])

  async function crearPlantilla(datos) {
    const { ok, datos: respuesta } = await apiFetch('/api/tenant/plantillas-credito', { method: 'POST', body: datos })
    if (!ok) throw new Error(respuesta.error || 'No se pudo crear la plantilla.')
    await Promise.all([cargarPlantillas(), cargarMora()])
  }

  async function editarPlantilla(id, datos) {
    const { ok, datos: respuesta } = await apiFetch(`/api/tenant/plantillas-credito/${id}`, { method: 'PUT', body: datos })
    if (!ok) throw new Error(respuesta.error || 'No se pudo guardar la plantilla.')
    await cargarPlantillas()
  }

  async function cambiarEstadoPlantilla(id, estado) {
    const { ok, datos: respuesta } = await apiFetch(`/api/tenant/plantillas-credito/${id}/estado`, { method: 'PATCH', body: { estado } })
    if (!ok) throw new Error(respuesta.error || 'No se pudo cambiar el estado de la plantilla.')
    await Promise.all([cargarPlantillas(), cargarMora()])
  }

  if (sinPermiso) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">No tienes permiso para ver esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">Módulo</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Intereses</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">Configura las plantillas con las que se otorgan los préstamos.</p>
        </div>
        <ConPermiso permiso="creditos.crear" compacto>
          <BotonAccion icono={<IcoMas />} onClick={() => setMostrandoModal(true)}>Crear plantilla</BotonAccion>
        </ConPermiso>
      </div>

      {/* 70/30 — listado de plantillas + qué plantillas tienden a tener más mora */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
        <TarjetaPanel
          icono={<IcoMoneda size={18} />}
          iconoClases="bg-primary/10 text-primary"
          titulo="Plantillas de intereses"
          subtitulo="Condiciones con las que se otorgan los préstamos."
        >
          {cargandoPlantillas ? (
            <p className="text-[13px] text-on-surface-variant">Cargando plantillas...</p>
          ) : plantillas.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">Aún no has creado ninguna plantilla.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[560px] text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                    <th className="font-semibold px-1 pb-2">Nombre</th>
                    <th className="font-semibold px-1 pb-2">Tasa</th>
                    <th className="font-semibold px-1 pb-2">Plazo</th>
                    <th className="font-semibold px-1 pb-2 text-center">Cuotas</th>
                    <th className="font-semibold px-1 pb-2">Frecuencia</th>
                    <th className="font-semibold px-1 pb-2">Monto</th>
                    <th className="font-semibold px-1 pb-2">Estado</th>
                    <th className="px-1 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {plantillas.map(p => (
                    <tr key={p.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                      <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{p.nombre}</td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{Number(p.tasaInteres)}%</td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{p.plazo} días</td>
                      <td className="px-1 py-3 text-on-background text-center">{textoCuotasPlantilla(p.numeroCuotas)}</td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{ETIQUETA_FRECUENCIA_PAGO[p.frecuenciaPago] ?? p.frecuenciaPago}</td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{rangoMontoPlantilla(p.montoMinimo, p.montoMaximo)}</td>
                      <td className="px-1 py-3"><ChipEstadoPlantilla estado={p.estado} /></td>
                      <td className="px-1 py-3 text-right">
                        <ConPermiso permiso="creditos.editar" compacto>
                          <button
                            type="button"
                            onClick={() => setPlantillaEditando(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] font-semibold text-on-background bg-surface-lowest hover:bg-surface-default transition-colors whitespace-nowrap"
                          >
                            <IcoEditar size={13} /> Editar
                          </button>
                        </ConPermiso>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TarjetaPanel>

        <TarjetaPanel
          icono={<IcoAlerta size={18} />}
          iconoClases="bg-error/12 text-error"
          titulo="Plantillas con más mora"
          subtitulo="% de préstamos en mora por plantilla usada."
        >
          {cargandoMora ? (
            <p className="text-[13px] text-on-surface-variant">Cargando...</p>
          ) : mora.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">Todavía no hay préstamos otorgados con ninguna plantilla.</p>
          ) : (
            <div>
              {mora.map(m => <FilaMora key={m.id} {...m} />)}
            </div>
          )}
        </TarjetaPanel>
      </div>

      {mostrandoModal && (
        <ModalCrearPlantilla onCerrar={() => setMostrandoModal(false)} onCrear={crearPlantilla} />
      )}

      {plantillaEditando && (
        <ModalEditarPlantilla
          plantilla={plantillaEditando}
          onCerrar={() => setPlantillaEditando(null)}
          onEditar={editarPlantilla}
          onCambiarEstado={cambiarEstadoPlantilla}
        />
      )}
    </div>
  )
}
