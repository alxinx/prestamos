import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import ChipEstado from '../../components/tenant/ChipEstado'
import Paginador from '../../components/tenant/Paginador'
import BotonAccion from '../../components/tenant/BotonAccion'
import ConPermiso from '../../components/tenant/ConPermiso'
import { IcoMas, IcoMoneda, IcoChevronAbajo, IcoBuscar, IcoAlerta, IcoTendencia, IcoOjo, IcoTelefono } from '../../components/tenant/iconos'
import { formatearPrecio, formatearFechaLocal } from '../../lib/formato'
import { inicialesDe, claseAvatar } from '../../lib/avatar'
import { apiFetch } from '../../lib/api'
import { navegarA } from '../../lib/navegacion'
// IcoBuscar/IcoAlerta/IcoTendencia viven en components/iconos.jsx (compartidos
// con Dashboard.jsx y Clientes.jsx).

const ESTADOS_CREDITO = [
  { value: '', label: 'Estado: Todos' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'EN_MORA', label: 'En mora' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'CASTIGADO', label: 'Castigado' },
  { value: 'REFINANCIADO', label: 'Refinanciado' },
]

const POR_PAGINA = 8

function SelectNativo({ valor, onChange, opciones }) {
  return (
    <div className="relative shrink-0">
      <select
        value={valor}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors cursor-pointer"
      >
        {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
        <IcoChevronAbajo />
      </span>
    </div>
  )
}

function SelectCobrador({ valor, onChange, cobradores }) {
  return (
    <SelectNativo
      valor={valor}
      onChange={onChange}
      opciones={[{ value: '', label: 'Cobrador: Todos' }, ...cobradores.map(c => ({ value: c.id, label: c.nombreCompleto }))]}
    />
  )
}

export default function Prestamos() {
  const [estadisticas, setEstadisticas] = useState({ capitalCirculando: 0, carteraEnMora: 0, recaudadoEsteMes: 0, prestamosActivos: 0 })
  const [cargandoStats, setCargandoStats] = useState(true)
  const [cobradores, setCobradores] = useState([])
  const [sinPermiso, setSinPermiso] = useState(false)

  // Sección 1 — préstamos en mora
  const [mora, setMora] = useState([])
  const [cargandoMora, setCargandoMora] = useState(true)
  const [cobradorMora, setCobradorMora] = useState('')

  // Sección 2 — todos los préstamos
  const [creditos, setCreditos] = useState([])
  const [cargandoCreditos, setCargandoCreditos] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [cobradorFiltro, setCobradorFiltro] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalCreditos, setTotalCreditos] = useState(0)

  async function cargarEstadisticas() {
    const { ok, status, datos } = await apiFetch('/api/tenant/creditos/estadisticas')
    if (status === 403) { setSinPermiso(true); setCargandoStats(false); return }
    if (ok) setEstadisticas(datos)
    setCargandoStats(false)
  }

  // Cobradores para los selects de filtro — mismo criterio que NuevoCliente.jsx
  // (rol COBRADOR activo). Si el rol del empleado no tiene permiso empleados.ver
  // (ej. SECRETARIA), esto simplemente falla en silencio y los filtros quedan
  // solo con la opción "Todos" — no bloquea el resto de la página.
  async function cargarCobradores() {
    const { ok, datos } = await apiFetch('/api/tenant/colaboradores')
    if (ok) setCobradores((datos.colaboradores || []).filter(c => c.rol?.nombre === 'COBRADOR' && c.estado === 'ACTIVO'))
  }

  async function cargarMora() {
    setCargandoMora(true)
    const params = new URLSearchParams({ ...(cobradorMora && { cobradorId: cobradorMora }) })
    const { ok, status, datos } = await apiFetch(`/api/tenant/creditos/mora?${params}`)
    if (status === 403) { setSinPermiso(true); setCargandoMora(false); return }
    if (ok) setMora(datos.creditos || [])
    setCargandoMora(false)
  }

  async function cargarCreditos() {
    setCargandoCreditos(true)
    const params = new URLSearchParams({
      busqueda: busquedaDebounced, estado: estadoFiltro, cobradorId: cobradorFiltro, fechaDesde, fechaHasta,
      pagina: String(pagina), porPagina: String(POR_PAGINA),
    })
    const { ok, status, datos } = await apiFetch(`/api/tenant/creditos?${params}`)
    if (status === 403) { setSinPermiso(true); setCargandoCreditos(false); return }
    if (ok) {
      setCreditos(datos.creditos || [])
      setTotalPaginas(datos.totalPaginas || 1)
      setTotalCreditos(datos.total || 0)
    }
    setCargandoCreditos(false)
  }

  useEffect(() => { cargarEstadisticas(); cargarCobradores() }, [])
  useEffect(() => { cargarMora() }, [cobradorMora])

  // Debounce del buscador: espera a que el usuario deje de escribir antes de
  // consultar la BD — evita un request por cada tecla presionada.
  useEffect(() => {
    const idTimeout = setTimeout(() => setBusquedaDebounced(busqueda), 400)
    return () => clearTimeout(idTimeout)
  }, [busqueda])

  useEffect(() => { cargarCreditos() }, [busquedaDebounced, estadoFiltro, cobradorFiltro, fechaDesde, fechaHasta, pagina])

  function buscar(valor) { setBusqueda(valor); setPagina(1) }
  function filtrarConReset(setter) {
    return valor => { setter(valor); setPagina(1) }
  }

  const inicioRango = totalCreditos === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1
  const finRango = Math.min(pagina * POR_PAGINA, totalCreditos)

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
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Préstamos</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">Consulta y administra los préstamos otorgados a tus clientes.</p>
        </div>
        <ConPermiso permiso="creditos.crear" compacto>
          <BotonAccion href="/prestamos/nuevo" icono={<IcoMas />}>Crear préstamo</BotonAccion>
        </ConPermiso>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <TarjetaStat
          titulo="Capital circulando"
          subtitulo="Prestado en créditos vigentes"
          valor={cargandoStats ? '—' : formatearPrecio(estadisticas.capitalCirculando)}
          imagen3d="/iconos/capitales.webp"
          // Este monto suele ser más largo que el resto de tarjetas — ícono
          // 20% más chico y anclado arriba (no centrado) para que nunca tape
          // el valor (mismo ajuste puntual documentado en TarjetaStat.jsx).
          imagenClases="absolute top-4 right-3 w-[86px] h-[86px] sm:w-[100px] sm:h-[100px] object-contain pointer-events-none select-none"
          badge={{ icono: <IcoMoneda size={14} />, clases: 'bg-on-tertiary-container/12 text-on-tertiary-container' }}
        />
        <TarjetaStat
          titulo="Cartera en mora"
          subtitulo="Créditos vencidos o en mora"
          valor={cargandoStats ? '—' : formatearPrecio(estadisticas.carteraEnMora)}
          imagen3d="/iconos/mora.webp"
          imagenClases="absolute top-4 right-3 w-[69px] h-[69px] sm:w-[80px] sm:h-[80px] object-contain pointer-events-none select-none"
          badge={{ icono: <IcoAlerta />, clases: 'bg-error/12 text-error' }}
          peligro={!cargandoStats && Number(estadisticas.carteraEnMora) > 0}
          valorAutoFit
          valorExtenderClases="-mr-[123px] sm:-mr-[141px] pr-4"
        />
        <TarjetaStat
          titulo="Recaudado este mes"
          subtitulo="Pagos liquidados del mes"
          valor={cargandoStats ? '—' : formatearPrecio(estadisticas.recaudadoEsteMes)}
          imagen3d="/iconos/recaudo.webp"
          imagenClases="absolute top-4 right-3 w-[86px] h-[86px] sm:w-[100px] sm:h-[100px] object-contain pointer-events-none select-none"
          badge={{ icono: <IcoMoneda size={14} />, clases: 'bg-secondary/10 text-secondary' }}
        />
        <TarjetaStat
          titulo="Préstamos activos"
          subtitulo="Total vigentes"
          valor={cargandoStats ? '—' : String(estadisticas.prestamosActivos)}
          imagen3d="/iconos/prestamos.webp"
          badge={{ icono: <IcoTendencia />, clases: 'bg-primary/10 text-primary' }}
        />
      </div>

      {/* Sección 1 — Préstamos en mora */}
      <TarjetaPanel
        icono={<IcoAlerta size={18} />}
        iconoClases="bg-error/12 text-error"
        titulo="Préstamos en mora"
        subtitulo="Ordenados por días de mora — los más críticos primero."
        accion={<SelectCobrador valor={cobradorMora} onChange={setCobradorMora} cobradores={cobradores} />}
      >
        {cargandoMora ? (
          <p className="text-[13px] text-on-surface-variant">Cargando préstamos en mora...</p>
        ) : mora.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">No hay préstamos en mora.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[720px] text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                  <th className="font-semibold px-1 pb-2">Cliente</th>
                  <th className="font-semibold px-1 pb-2">Cobrador</th>
                  <th className="font-semibold px-1 pb-2">Valor cuota</th>
                  <th className="font-semibold px-1 pb-2 text-center">Días mora</th>
                  <th className="font-semibold px-1 pb-2">Estado</th>
                  <th className="px-1 pb-2" />
                </tr>
              </thead>
              <tbody>
                {mora.map((c, i) => (
                  <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                    <td className="px-1 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                          {inicialesDe(c.cliente)}
                        </span>
                        <p className="text-on-background font-semibold truncate m-0">{c.cliente}</p>
                      </div>
                    </td>
                    <td className="px-1 py-3 text-on-background whitespace-nowrap">{c.cobrador}</td>
                    <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.valorCuota)}</td>
                    <td className="px-1 py-3 text-center">
                      <span className={`font-bold ${c.diasMora >= 30 ? 'text-error' : 'text-on-background'}`}>{c.diasMora}</span>
                    </td>
                    <td className="px-1 py-3"><ChipEstado estado={c.estado} /></td>
                    <td className="px-1 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navegarA(`/prestamos/${c.id}/detalle`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] font-semibold text-on-background bg-surface-lowest hover:bg-surface-default transition-colors whitespace-nowrap"
                      >
                        <IcoOjo size={13} /> Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TarjetaPanel>

      {/* Sección 2 — Todos los préstamos */}
      <div className="mt-4">
        <TarjetaPanel
          icono={<IcoMoneda size={18} />}
          iconoClases="bg-primary/10 text-primary"
          titulo="Todos los préstamos"
          subtitulo="Consulta y administra los préstamos otorgados."
          accion={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                  <IcoBuscar />
                </span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => buscar(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors w-[150px] sm:w-[180px]"
                />
              </div>
              <SelectNativo valor={estadoFiltro} onChange={filtrarConReset(setEstadoFiltro)} opciones={ESTADOS_CREDITO} />
              <SelectCobrador valor={cobradorFiltro} onChange={filtrarConReset(setCobradorFiltro)} cobradores={cobradores} />
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => filtrarConReset(setFechaDesde)(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors [color-scheme:light]"
                />
                <span className="text-on-surface-variant text-[12px]">a</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => filtrarConReset(setFechaHasta)(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors [color-scheme:light]"
                />
              </div>
            </div>
          }
        >
          {cargandoCreditos ? (
            <p className="text-[13px] text-on-surface-variant">Cargando préstamos...</p>
          ) : creditos.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">No se encontraron préstamos.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[820px] text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                    <th className="font-semibold px-1 pb-2">Cliente</th>
                    <th className="font-semibold px-1 pb-2">Cobrador</th>
                    <th className="font-semibold px-1 pb-2">Monto</th>
                    <th className="font-semibold px-1 pb-2">Saldo</th>
                    <th className="font-semibold px-1 pb-2">Estado</th>
                    <th className="font-semibold px-1 pb-2">Próxima cuota</th>
                    <th className="px-1 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {creditos.map((c, i) => (
                    <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                      <td className="px-1 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                            {inicialesDe(c.cliente)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-on-background font-semibold truncate m-0">{c.cliente}</p>
                            <p className="text-on-surface-variant text-[12px] truncate m-0 flex items-center gap-1">
                              CC {c.clienteCedula} · <IcoTelefono size={11} /> {c.clienteTelefono}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{c.cobrador}</td>
                      <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.monto)}</td>
                      <td className={`px-1 py-3 font-semibold whitespace-nowrap ${c.saldo > 0 ? 'text-error' : 'text-secondary'}`}>
                        {formatearPrecio(c.saldo)}
                      </td>
                      <td className="px-1 py-3"><ChipEstado estado={c.estado} /></td>
                      <td className="px-1 py-3 text-on-background whitespace-nowrap">{formatearFechaLocal(c.proximaCuota)}</td>
                      <td className="px-1 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navegarA(`/prestamos/${c.id}/detalle`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] font-semibold text-on-background bg-surface-lowest hover:bg-surface-default transition-colors whitespace-nowrap"
                        >
                          <IcoOjo size={13} /> Ver detalle
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
              Mostrando {inicioRango} a {finRango} de {totalCreditos} préstamos
            </p>
            <Paginador pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
          </div>
        </TarjetaPanel>
      </div>

    </div>
  )
}
