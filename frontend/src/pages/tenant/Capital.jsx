import { useEffect, useMemo, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import ChipEstado from '../../components/tenant/ChipEstado'
import Paginador from '../../components/tenant/Paginador'
import BotonAccion from '../../components/tenant/BotonAccion'
import ModalCrearCapitalSocio from '../../components/tenant/ModalCrearCapitalSocio'
import ModalConfirmacion from '../../components/tenant/ModalConfirmacion'
import ModalConfirmarContrasena from '../../components/tenant/ModalConfirmarContrasena'
import ConPermiso from '../../components/tenant/ConPermiso'
import usePermisos from '../../hooks/usePermisos'
import { IcoMas, IcoEdificio, IcoPausa, IcoPlay } from '../../components/tenant/iconos'
import { formatearPrecio } from '../../lib/formato'
import { inicialesDe, claseAvatar } from '../../lib/avatar'
import { apiFetch } from '../../lib/api'
import { escribirTirillaAjusteCapital } from '../../lib/tirillaCapital'

// ── Íconos propios de esta página (sin equivalente compartido) ─────────────

function IcoBanco() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4z" />
    </svg>
  )
}


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

const CLASES_ICONO_CAPITAL = ['bg-secondary/15 text-secondary', 'bg-on-tertiary-container/15 text-on-tertiary-container', 'bg-tertiary-container/25 text-on-tertiary-container', 'bg-error-container text-on-error-container']

const POR_PAGINA = 6

export default function Capital() {
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()
  const [socios, setSocios] = useState([])
  const [capital, setCapital] = useState([])
  const [estadisticas, setEstadisticas] = useState({ totalGlobal: 0, numCapitales: 0 })
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalCapitales, setTotalCapitales] = useState(0)
  const [cargandoCapital, setCargandoCapital] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [socioSuspendiendo, setSocioSuspendiendo] = useState(null)
  const [pidiendoPasswordSocio, setPidiendoPasswordSocio] = useState(false)
  const [socioReactivando, setSocioReactivando] = useState(null)
  const [errorAccionSocio, setErrorAccionSocio] = useState('')

  const sociosPorId = useMemo(() => new Map(socios.map((s, i) => [s.id, { ...s, indice: i }])), [socios])

  async function cargarCapital() {
    setCargandoCapital(true)
    const params = new URLSearchParams({ busqueda, pagina: String(pagina), porPagina: String(POR_PAGINA) })
    const { ok, status, datos } = await apiFetch(`/api/tenant/capital?${params}`)
    if (status === 403) { setSinPermiso(true); setCargandoCapital(false); return }
    if (ok) {
      setCapital(datos.capital || [])
      setTotalPaginas(datos.totalPaginas || 1)
      setTotalCapitales(datos.total || 0)
    }
    setCargandoCapital(false)
  }

  async function cargarEstadisticasYSocios() {
    const [estadisticasRes, sociosRes] = await Promise.all([
      apiFetch('/api/tenant/capital/estadisticas'),
      apiFetch('/api/tenant/socios'),
    ])
    if (estadisticasRes.status === 403 || sociosRes.status === 403) { setSinPermiso(true); setCargando(false); return }
    if (estadisticasRes.ok) setEstadisticas(estadisticasRes.datos)
    if (sociosRes.ok) setSocios(sociosRes.datos.socios || [])
    setCargando(false)
  }

  useEffect(() => { cargarEstadisticasYSocios() }, [])
  useEffect(() => { cargarCapital() }, [busqueda, pagina])

  function buscar(valor) {
    setBusqueda(valor)
    setPagina(1)
  }

  async function crearCapital(datos, ventana) {
    const { ok, datos: respuesta } = await apiFetch('/api/tenant/capital', { method: 'POST', body: datos })
    if (!ok) throw new Error(respuesta.error || 'No se pudo crear el capital.')
    await Promise.all([cargarCapital(), cargarEstadisticasYSocios()])
    escribirTirillaAjusteCapital(ventana, respuesta.comprobante)
  }

  async function crearSocio(datos) {
    const { ok, datos: respuesta } = await apiFetch('/api/tenant/socios', { method: 'POST', body: datos })
    if (!ok) throw new Error(respuesta.error || 'No se pudo crear el socio.')
    await cargarEstadisticasYSocios()
  }

  async function suspenderSocio(password) {
    const { ok, datos } = await apiFetch(`/api/tenant/socios/${socioSuspendiendo.id}/suspender`, {
      method: 'PATCH',
      body: { password },
    })
    if (!ok) throw new Error(datos.error || 'No se pudo suspender el socio.')
    setPidiendoPasswordSocio(false)
    setSocioSuspendiendo(null)
    await cargarEstadisticasYSocios()
  }

  async function reactivarSocio() {
    const socio = socioReactivando
    setSocioReactivando(null)
    setErrorAccionSocio('')
    const { ok, datos } = await apiFetch(`/api/tenant/socios/${socio.id}/reactivar`, { method: 'PATCH' })
    if (ok) await cargarEstadisticasYSocios()
    else setErrorAccionSocio(datos.error || 'No se pudo reactivar el socio.')
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
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Capital y Socios</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">Gestiona los capitales y socios de la empresa.</p>
        </div>
        <ConPermiso permiso="capital.crear" compacto>
          <BotonAccion onClick={() => setMostrarModal(true)} icono={<IcoMas />}>
            Crear socio / capital
          </BotonAccion>
        </ConPermiso>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 items-start">

        {/* Izquierda: stats + socios */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <TarjetaStat
              compacto
              titulo="Total capital global"
              subtitulo="Valor total invertido"
              valor={cargando ? '—' : formatearPrecio(estadisticas.totalGlobal)}
              imagen3d="/iconos/capitales.webp"
            />
            <TarjetaStat
              compacto
              centrarValor
              titulo="Nro. de capitales"
              subtitulo="Capitales activos"
              valor={cargando ? '—' : String(estadisticas.numCapitales)}
              imagen3d="/iconos/banco.webp"
            />
          </div>

          <TarjetaPanel
            icono={<IcoBanco />}
            iconoClases="bg-primary/10 text-primary"
            titulo="Socios"
            subtitulo="Listado de socios y sus capitales"
          >
            {cargando ? (
              <p className="text-[13px] text-on-surface-variant">Cargando socios...</p>
            ) : socios.length === 0 ? (
              <p className="text-[13px] text-on-surface-variant">Aún no hay socios registrados.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {socios.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                      {inicialesDe(s.nombreCompleto)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-on-background truncate m-0">{s.nombreCompleto}</p>
                        {!s.activo && <ChipEstado estado="INACTIVA" />}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-on-background m-0">{formatearPrecio(s.montoTotal)}</p>
                      <p className="text-[11px] text-on-surface-variant m-0">{s.porcentaje}% del total</p>
                    </div>
                    {/* Ninguno de los dos botones se muestra mientras cargan los permisos ni
                        si el empleado no tiene el permiso correspondiente. Suspender exige
                        doble clic — evita suspender un socio por un clic accidental. */}
                    {!cargandoPermisos && s.activo && tienePermiso('capital.eliminar') && (
                      <button
                        onDoubleClick={() => setSocioSuspendiendo(s)}
                        title="Haz doble clic para suspender a este socio"
                        aria-label="Suspender socio"
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 text-error hover:bg-error/15 transition-colors select-none"
                      >
                        <IcoPausa size={13} />
                      </button>
                    )}
                    {!cargandoPermisos && !s.activo && tienePermiso('capital.crear') && (
                      <button
                        onClick={() => setSocioReactivando(s)}
                        title="Activar socio"
                        aria-label="Activar socio"
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/10 text-secondary hover:bg-secondary/15 transition-colors"
                      >
                        <IcoPlay size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {errorAccionSocio && <p className="text-[12px] text-error mt-2 mb-0">{errorAccionSocio}</p>}

            <a href="#" className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-outline-variant/40 text-[13px] text-on-surface-variant hover:text-on-background transition-colors no-underline">
              Ver todos los socios <span>→</span>
            </a>
          </TarjetaPanel>
        </div>

        {/* Derecha: tabla de capitales */}
        <TarjetaPanel
          icono={<IcoEdificio />}
          iconoClases="bg-primary/10 text-primary"
          titulo="Capitales"
          subtitulo="Listado de capitales registrados"
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
                  placeholder="Buscar capital..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors w-[180px] sm:w-[220px]"
                />
              </div>
              <button
                type="button"
                aria-label="Filtrar"
                title="Filtrar"
                className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant bg-surface-lowest hover:bg-surface-default transition-colors shrink-0"
              >
                <IcoFiltro />
              </button>
            </div>
          }
        >
          {cargandoCapital ? (
            <p className="text-[13px] text-on-surface-variant">Cargando capitales...</p>
          ) : capital.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">No se encontraron capitales.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[720px] text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                    <th className="font-semibold px-1 pb-2">Nombre del capital</th>
                    <th className="font-semibold px-1 pb-2">Valor del capital</th>
                    <th className="font-semibold px-1 pb-2">Disponible / En uso</th>
                    <th className="font-semibold px-1 pb-2 text-center">Nro. de préstamos</th>
                    <th className="font-semibold px-1 pb-2">Socio del capital</th>
                    <th className="font-semibold px-1 pb-2">Estado</th>
                    <th className="px-1 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {capital.map((c, i) => {
                    const socio = sociosPorId.get(c.socio.id)
                    return (
                      <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                        <td className="px-1 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CLASES_ICONO_CAPITAL[i % CLASES_ICONO_CAPITAL.length]}`}>
                              <IcoEdificio size={15} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-on-background font-semibold truncate m-0">{c.nombre}</p>
                              <p className="text-on-surface-variant text-[12px] truncate m-0">{c.codigo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.valorTotal)}</td>
                        <td className="px-1 py-3 whitespace-nowrap">
                          <p className="text-secondary font-semibold m-0">{formatearPrecio(c.disponible)}</p>
                          <p className="text-on-surface-variant text-[12px] m-0">({formatearPrecio(c.enUso)} en uso)</p>
                        </td>
                        <td className="px-1 py-3 text-on-background font-semibold text-center">{c.numPrestamos}</td>
                        <td className="px-1 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${claseAvatar(socio?.indice ?? 0)}`}>
                              {inicialesDe(c.socio.nombre)}
                            </span>
                            <span className="text-on-background whitespace-nowrap">{c.socio.nombre}</span>
                          </div>
                        </td>
                        <td className="px-1 py-3"><ChipEstado estado={c.estado} /></td>
                        <td className="px-1 py-3">
                          <a
                            href={`/capital/${c.id}/panel`}
                            className="inline-block whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors no-underline"
                          >
                            Ver panel
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/40 flex-wrap gap-3">
            <p className="text-[12px] text-on-surface-variant m-0">
              Mostrando {capital.length} de {totalCapitales} capitales
            </p>
            <Paginador pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
          </div>
        </TarjetaPanel>
      </div>

      {mostrarModal && (
        <ModalCrearCapitalSocio
          socios={socios.filter(s => s.activo).map(s => ({ id: s.id, nombre: s.nombreCompleto }))}
          onCerrar={() => setMostrarModal(false)}
          onCrearCapital={crearCapital}
          onCrearSocio={crearSocio}
        />
      )}

      {socioSuspendiendo && (
        <ModalConfirmacion
          tipo="advertencia"
          titulo="¿Suspender este socio?"
          mensaje={
            <>
              <strong>{socioSuspendiendo.nombreCompleto}</strong> quedará suspendido: a partir de ahora no se le
              asignarán nuevos capitales. Los capitales que ya tiene activos seguirán funcionando con total
              normalidad — esta acción no los afecta.
            </>
          }
          textoConfirmar="Sí, continuar"
          onConfirmar={() => setPidiendoPasswordSocio(true)}
          onCancelar={() => setSocioSuspendiendo(null)}
        />
      )}

      {pidiendoPasswordSocio && (
        <ModalConfirmarContrasena
          titulo="Confirma tu identidad"
          mensaje="Por seguridad, ingresa tu contraseña para suspender a este socio."
          textoConfirmar="Suspender socio"
          onConfirmar={suspenderSocio}
          onCancelar={() => { setPidiendoPasswordSocio(false); setSocioSuspendiendo(null) }}
        />
      )}

      {socioReactivando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Activar este socio?"
          mensaje={
            <>
              <strong>{socioReactivando.nombreCompleto}</strong> volverá a estar disponible para que se le asignen
              nuevos capitales.
            </>
          }
          textoConfirmar="Sí, activar"
          onConfirmar={reactivarSocio}
          onCancelar={() => setSocioReactivando(null)}
        />
      )}
    </div>
  )
}
