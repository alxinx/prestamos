import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import ChipEstado from '../../components/tenant/ChipEstado'
import Paginador from '../../components/tenant/Paginador'
import BotonAccion from '../../components/tenant/BotonAccion'
import ConPermiso from '../../components/tenant/ConPermiso'
import { IcoMas, IcoPersonas, IcoCheck, IcoReloj, IcoChevronAbajo, IcoOpciones, IcoEstrella } from '../../components/tenant/iconos'
import { formatearPrecio } from '../../lib/formato'
import { inicialesDe, claseAvatar } from '../../lib/avatar'
import { apiFetch } from '../../lib/api'

// ── Íconos propios de esta página (sin equivalente compartido) ─────────────

function IcoBuscar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IcoFiltro() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

// Badge pequeño de la tarjeta "Clientes en mora" — mismo triángulo de alerta que
// usan Dashboard.jsx y CapitalPanel.jsx en sus propios badges/zonas de riesgo,
// redefinido aquí en vez de compartido (es un ícono de 14px, de un solo uso por página).
function IcoAlerta({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  )
}

const POR_PAGINA = 6

function Estrellas({ calificacion }) {
  if (calificacion == null) return <span className="text-on-surface-variant text-[12px]">—</span>
  return (
    <div className="flex items-center gap-0.5 text-[#FBBF24]">
      {Array.from({ length: 5 }, (_, i) => (
        <IcoEstrella key={i} lleno={i < Math.round(calificacion)} />
      ))}
    </div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [estadisticas, setEstadisticas] = useState({ total: 0, porcentajeAlDia: 0, porFinalizar: 0, enMora: 0 })
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const [cargandoClientes, setCargandoClientes] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)

  async function cargarClientes() {
    setCargandoClientes(true)
    const params = new URLSearchParams({ busqueda, pagina: String(pagina), porPagina: String(POR_PAGINA), estado: estadoFiltro })
    const { ok, status, datos } = await apiFetch(`/api/tenant/clientes?${params}`)
    if (status === 403) { setSinPermiso(true); setCargandoClientes(false); return }
    if (ok) {
      setClientes(datos.clientes || [])
      setTotalPaginas(datos.totalPaginas || 1)
      setTotalClientes(datos.total || 0)
    }
    setCargandoClientes(false)
  }

  async function cargarEstadisticas() {
    const { ok, status, datos } = await apiFetch('/api/tenant/clientes/estadisticas')
    if (status === 403) { setSinPermiso(true); setCargando(false); return }
    if (ok) setEstadisticas(datos)
    setCargando(false)
  }

  useEffect(() => { cargarEstadisticas() }, [])
  useEffect(() => { cargarClientes() }, [busqueda, pagina, estadoFiltro])

  function buscar(valor) {
    setBusqueda(valor)
    setPagina(1)
  }

  function filtrarPorEstado(valor) {
    setEstadoFiltro(valor)
    setPagina(1)
  }

  const inicioRango = totalClientes === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1
  const finRango = Math.min(pagina * POR_PAGINA, totalClientes)

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
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Clientes</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">Gestiona y consulta la información de todos tus clientes.</p>
        </div>
        <ConPermiso permiso="clientes.crear" compacto>
          <BotonAccion href="/clientes/nuevo" icono={<IcoMas />}>Crear cliente</BotonAccion>
        </ConPermiso>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <TarjetaStat
          titulo="Total clientes"
          subtitulo="Clientes registrados"
          valor={cargando ? '—' : String(estadisticas.total)}
          imagen3d="/iconos/users.webp"
          badge={{ icono: <IcoPersonas size={14} />, clases: 'bg-on-tertiary-container/12 text-on-tertiary-container' }}
        />
        <TarjetaStat
          titulo="% de clientes al día"
          subtitulo="Clientes con estado activo"
          valor={cargando ? '—' : `${estadisticas.porcentajeAlDia}%`}
          imagen3d="/iconos/escudo.webp"
          badge={{ icono: <IcoCheck size={14} />, clases: 'bg-secondary/10 text-secondary' }}
        />
        <TarjetaStat
          titulo="Clientes por finalizar"
          subtitulo="Con 1 a 3 cuotas pendientes"
          valor={cargando ? '—' : String(estadisticas.porFinalizar)}
          imagen3d="/iconos/time.webp"
          // Mismo ámbar reutilizado en ChipEstado para POR_FINALIZAR — ver esa nota.
          badge={{ icono: <IcoReloj size={14} />, clases: 'bg-[#FBBF24]/15 text-[#FBBF24]' }}
        />
        <TarjetaStat
          titulo="Clientes en mora"
          subtitulo="Con pagos vencidos"
          valor={cargando ? '—' : String(estadisticas.enMora)}
          imagen3d="/iconos/mora.webp"
          badge={{ icono: <IcoAlerta />, clases: 'bg-error/12 text-error' }}
          peligro={!cargando && estadisticas.enMora > 0}
        />
      </div>

      {/* Listado */}
      <TarjetaPanel
        icono={<IcoPersonas size={18} />}
        iconoClases="bg-primary/10 text-primary"
        titulo="Listado de clientes"
        subtitulo="Consulta y administra la información de tus clientes."
        accion={
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                <IcoBuscar />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={e => buscar(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-9 pr-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors w-[160px] sm:w-[200px]"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-surface-variant bg-surface-lowest hover:bg-surface-default transition-colors shrink-0"
            >
              <IcoFiltro /> Filtros
            </button>
            <div className="relative shrink-0">
              <select
                value={estadoFiltro}
                onChange={e => filtrarPorEstado(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Estado: Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="EN_MORA">En mora</option>
                <option value="BLOQUEADO">Bloqueado</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="FALLECIDO">Fallecido</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                <IcoChevronAbajo />
              </span>
            </div>
          </div>
        }
      >
        {cargandoClientes ? (
          <p className="text-[13px] text-on-surface-variant">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">No se encontraron clientes.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[880px] text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                  <th className="font-semibold px-1 pb-2">Cliente</th>
                  <th className="font-semibold px-1 pb-2">Identificación</th>
                  <th className="font-semibold px-1 pb-2 text-center">Préstamos</th>
                  <th className="font-semibold px-1 pb-2">Valor de préstamo</th>
                  <th className="font-semibold px-1 pb-2">Valor adeudado</th>
                  <th className="font-semibold px-1 pb-2">Calificación</th>
                  <th className="font-semibold px-1 pb-2 text-center">Cuotas faltantes</th>
                  <th className="font-semibold px-1 pb-2">Estado</th>
                  <th className="px-1 pb-2" />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, i) => (
                  <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                    <td className="px-1 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                          {inicialesDe(c.nombreCompleto)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-on-background font-semibold truncate m-0">{c.nombreCompleto}</p>
                          <p className="text-on-surface-variant text-[12px] truncate m-0">{c.telefono}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-3 text-on-background whitespace-nowrap">CC {c.cedula}</td>
                    <td className="px-1 py-3 text-on-background font-semibold text-center">{c.numPrestamos}</td>
                    <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.valorPrestamo)}</td>
                    <td className={`px-1 py-3 font-semibold whitespace-nowrap ${c.valorAdeudado > 0 ? 'text-error' : 'text-secondary'}`}>
                      {formatearPrecio(c.valorAdeudado)}
                    </td>
                    <td className="px-1 py-3"><Estrellas calificacion={c.calificacion} /></td>
                    <td className="px-1 py-3 text-on-background font-semibold text-center">{c.cuotasFaltantes}</td>
                    <td className="px-1 py-3"><ChipEstado estado={c.estado} /></td>
                    <td className="px-1 py-3 text-right">
                      <button
                        type="button"
                        aria-label="Más acciones"
                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-default transition-colors"
                      >
                        <IcoOpciones />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/40 flex-wrap gap-3">
          <p className="text-[12px] text-on-surface-variant m-0">
            Mostrando {inicioRango} a {finRango} de {totalClientes} clientes
          </p>
          <Paginador pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </div>
      </TarjetaPanel>
    </div>
  )
}
