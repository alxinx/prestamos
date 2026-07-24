import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStatChica from '../../components/tenant/TarjetaStatChica'
import ChipEstado from '../../components/tenant/ChipEstado'
import Estrellas from '../../components/tenant/Estrellas'
import BotonAccion from '../../components/tenant/BotonAccion'
import SelectorDocumentos from '../../components/tenant/SelectorDocumentos'
import {
  IcoPersonas, IcoTelefono, IcoCheck, IcoMoneda, IcoReloj, IcoEditar, IcoAlerta, IcoOjo,
  IcoArchivo, IcoArchivoImagen, IcoArchivoPdf, IcoArchivoWord, IcoArchivoExcel, IcoArchivoPowerPoint,
} from '../../components/tenant/iconos'
import { formatearPrecio, formatearFecha, formatearFechaLocal } from '../../lib/formato'
import { formatearTamanoArchivo } from '../../lib/documentos'
import { ETIQUETA_TIPO_UBICACION, ETIQUETA_RELACION } from '../../lib/clienteWizardConstantes'
import { inicialesDe, claseAvatar } from '../../lib/avatar'
import { navegarA } from '../../lib/navegacion'
import { apiFetch } from '../../lib/api'

function idDesdePath() {
  return window.location.pathname.split('/')[2]
}

function IcoCasa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
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

function IcoPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const ICONO_UBICACION = { RESIDENCIA: IcoCasa, TRABAJO: IcoMaletin }

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const ICONO_POR_EXTENSION = {
  pdf: IcoArchivoPdf,
  doc: IcoArchivoWord, docx: IcoArchivoWord,
  xls: IcoArchivoExcel, xlsx: IcoArchivoExcel,
  ppt: IcoArchivoPowerPoint, pptx: IcoArchivoPowerPoint,
}
function iconoParaExtension(extension) {
  if (EXTENSIONES_IMAGEN.includes(extension)) return IcoArchivoImagen
  return ICONO_POR_EXTENSION[extension] || IcoArchivo
}

const TABS = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'prestamos', etiqueta: 'Préstamos' },
  { id: 'pagos', etiqueta: 'Pagos' },
  { id: 'documentos', etiqueta: 'Documentos' },
  { id: 'referencias', etiqueta: 'Referencias' },
]

function SinPermiso() {
  return <p className="text-[13px] text-on-surface-variant py-6 text-center">No tienes permiso para ver esta información.</p>
}

function TablaMovimientos({ movimientos, cargando }) {
  if (cargando) return <p className="text-[13px] text-on-surface-variant">Cargando movimientos...</p>
  if (movimientos.length === 0) return <p className="text-[13px] text-on-surface-variant">Sin movimientos registrados.</p>
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[480px] text-[13px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
            <th className="font-semibold px-1 pb-2">Fecha</th>
            <th className="font-semibold px-1 pb-2">Concepto</th>
            <th className="font-semibold px-1 pb-2">Monto</th>
            <th className="font-semibold px-1 pb-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map(m => (
            <tr key={m.id} className="border-t border-outline-variant/40">
              <td className="px-1 py-2.5 text-on-surface-variant whitespace-nowrap">{formatearFecha(m.fecha)}</td>
              <td className="px-1 py-2.5 text-on-background">{m.concepto}</td>
              <td className="px-1 py-2.5 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(m.monto)}</td>
              <td className="px-1 py-2.5"><ChipEstado estado={m.extemporaneo ? 'EXTEMPORANEO' : m.estado} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResumenTab({ perfil, onVerTodos }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
      <TarjetaPanel icono={<IcoReloj size={16} />} iconoClases="bg-secondary/10 text-secondary" titulo="Últimos movimientos" subtitulo="Pagos y abonos más recientes">
        <TablaMovimientos movimientos={perfil.ultimosMovimientos} cargando={false} />
        {perfil.ultimosMovimientos.length > 0 && (
          <button
            type="button"
            onClick={onVerTodos}
            className="mt-4 text-[13px] font-semibold text-secondary bg-transparent border-none cursor-pointer p-0 flex items-center gap-1.5"
          >
            Ver todos los movimientos →
          </button>
        )}
      </TarjetaPanel>

      <TarjetaPanel icono={<IcoPin size={16} />} iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container" titulo="Ubicaciones" subtitulo="Direcciones registradas">
        <div className="flex flex-col gap-3">
          {perfil.ubicaciones.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant m-0">Sin ubicaciones registradas.</p>
          ) : (
            perfil.ubicaciones.map(u => {
              const Icono = ICONO_UBICACION[u.tipo] ?? IcoPin
              return (
                <div key={u.id} className="rounded-xl border border-outline-variant/50 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 h-7 rounded-lg bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
                      <Icono />
                    </span>
                    <span className="text-[13px] font-semibold text-on-background">{ETIQUETA_TIPO_UBICACION[u.tipo] ?? u.tipo}</span>
                    {u.esPrincipal && (
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-secondary-container/25 text-on-secondary-container">Principal</span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-on-surface-variant m-0">{[u.direccion, u.barrio, u.ciudad].filter(Boolean).join(', ')}</p>
                  {u.referencia && <p className="text-[12px] text-on-surface-variant m-0 mt-1">{u.referencia}</p>}
                  {u.horarioUbicacion && (
                    <p className="text-[11.5px] text-on-surface-variant m-0 mt-1 flex items-center gap-1">
                      <IcoReloj size={11} /> {u.horarioUbicacion}
                    </p>
                  )}
                </div>
              )
            })
          )}
          <button
            type="button"
            disabled
            className="mt-1 w-full py-2.5 rounded-lg border border-dashed border-outline-variant text-[13px] text-on-surface-variant cursor-not-allowed"
          >
            + Agregar ubicación
          </button>
        </div>
      </TarjetaPanel>
    </div>
  )
}

function PrestamosTab({ clienteId }) {
  const [creditos, setCreditos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/creditos?clienteId=${clienteId}&porPagina=50`).then(({ ok, status, datos }) => {
      if (!vigente) return
      if (status === 403) { setSinPermiso(true); setCargando(false); return }
      if (ok) setCreditos(datos.creditos || [])
      setCargando(false)
    })
    return () => { vigente = false }
  }, [clienteId])

  if (sinPermiso) return <SinPermiso />
  if (cargando) return <p className="text-[13px] text-on-surface-variant">Cargando préstamos...</p>
  if (creditos.length === 0) return <p className="text-[13px] text-on-surface-variant">Este cliente no tiene préstamos registrados.</p>

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[640px] text-[13px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
            <th className="font-semibold px-1 pb-2">Cobrador</th>
            <th className="font-semibold px-1 pb-2">Monto</th>
            <th className="font-semibold px-1 pb-2">Saldo</th>
            <th className="font-semibold px-1 pb-2">Estado</th>
            <th className="font-semibold px-1 pb-2">Próxima cuota</th>
            <th className="px-1 pb-2" />
          </tr>
        </thead>
        <tbody>
          {creditos.map(c => (
            <tr key={c.id} className="border-t border-outline-variant/40">
              <td className="px-1 py-2.5 text-on-background whitespace-nowrap">{c.cobrador}</td>
              <td className="px-1 py-2.5 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.monto)}</td>
              <td className={`px-1 py-2.5 font-semibold whitespace-nowrap ${c.saldo > 0 ? 'text-error' : 'text-secondary'}`}>{formatearPrecio(c.saldo)}</td>
              <td className="px-1 py-2.5"><ChipEstado estado={c.estado} /></td>
              <td className="px-1 py-2.5 text-on-background whitespace-nowrap">{c.proximaCuota ? formatearFechaLocal(c.proximaCuota) : '—'}</td>
              <td className="px-1 py-2.5 text-right">
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
  )
}

function PagosTab({ clienteId }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/clientes/${clienteId}/pagos?porPagina=50`).then(({ ok, status, datos }) => {
      if (!vigente) return
      if (status === 403) { setSinPermiso(true); setCargando(false); return }
      if (ok) setMovimientos(datos.movimientos || [])
      setCargando(false)
    })
    return () => { vigente = false }
  }, [clienteId])

  if (sinPermiso) return <SinPermiso />
  return <TablaMovimientos movimientos={movimientos} cargando={cargando} />
}

function DocumentosTab({ clienteId }) {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [documentosNuevos, setDocumentosNuevos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState('')

  async function cargar() {
    setCargando(true)
    const { ok, status, datos } = await apiFetch(`/api/tenant/clientes/${clienteId}/documentos`)
    if (status === 403) { setSinPermiso(true); setCargando(false); return }
    if (ok) setDocumentos(datos.documentos || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  async function subirTodos() {
    if (documentosNuevos.length === 0) return
    setSubiendo(true)
    setErrorSubida('')

    const subidos = []
    const pendientes = []
    for (const d of documentosNuevos) {
      const formData = new FormData()
      formData.append('nombre', d.nombre)
      formData.append('archivo', d.archivo)
      const { ok, datos } = await apiFetch(`/api/tenant/clientes/${clienteId}/documentos`, { method: 'POST', body: formData })
      if (ok) subidos.push(datos.documento)
      else pendientes.push(d)
    }

    setSubiendo(false)
    setDocumentosNuevos(pendientes)
    if (subidos.length > 0) setDocumentos(actuales => [...subidos, ...actuales])
    if (pendientes.length > 0) setErrorSubida(`No se pudieron subir ${pendientes.length} documento(s). Revisa e intenta de nuevo.`)
  }

  // Un solo clic abre la URL firmada temporal en pestaña nueva — el navegador
  // decide si la muestra (imágenes/PDF) o la descarga (Word/Excel), cubriendo
  // "visitar o descargar" con la misma acción. Nunca se expone la ruta directa
  // de R2 (CLAUDE.md §9).
  async function abrir(documento) {
    const { ok, datos } = await apiFetch(`/api/tenant/clientes/${clienteId}/documentos/${documento.id}/descargar`)
    if (ok && datos.url) window.open(datos.url, '_blank', 'noopener,noreferrer')
  }

  if (sinPermiso) return <SinPermiso />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Izquierda: cuadrícula de documentos ya cargados */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-3">
          Documentos cargados
        </p>
        {cargando ? (
          <p className="text-[13px] text-on-surface-variant">Cargando documentos...</p>
        ) : documentos.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">Este cliente no tiene documentos cargados.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {documentos.map(d => {
              const IconoTipo = iconoParaExtension(d.extension)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => abrir(d)}
                  title={d.nombreArchivo}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant/50 bg-surface-default hover:bg-surface-high hover:border-outline-variant transition-colors text-center cursor-pointer"
                >
                  <span className="w-11 h-11 rounded-lg bg-surface-lowest flex items-center justify-center text-primary shrink-0">
                    <IconoTipo size={22} />
                  </span>
                  <span className="text-[12px] font-medium text-on-background truncate w-full">{d.nombreArchivo}</span>
                  <span className="text-[11px] text-on-surface-variant">{formatearTamanoArchivo(d.tamanioBytes || 0)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Derecha: subir documentos nuevos */}
      <div>
        <SelectorDocumentos documentos={documentosNuevos} onCambiar={setDocumentosNuevos} />
        <BotonAccion onClick={subirTodos} disabled={documentosNuevos.length === 0} cargando={subiendo} className="w-full mt-3">
          Subir {documentosNuevos.length > 0 ? `(${documentosNuevos.length})` : ''}
        </BotonAccion>
        {errorSubida && <p className="text-[12px] text-error mt-1.5">{errorSubida}</p>}
      </div>
    </div>
  )
}

function ReferenciasTab({ referencias }) {
  if (referencias.length === 0) return <p className="text-[13px] text-on-surface-variant">Sin referencias registradas.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {referencias.map(r => (
        <div key={r.id} className="rounded-xl border border-outline-variant/50 p-3.5 text-[13px]">
          <span className="font-semibold text-on-background">{r.nombreCompleto}</span>
          <span className="ml-1.5 text-on-surface-variant">
            {r.telefono} · {ETIQUETA_RELACION[r.relacionConCliente] ?? r.relacionConCliente}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ClientePerfil() {
  const clienteId = idDesdePath()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('resumen')

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/clientes/${clienteId}/perfil`).then(({ ok, datos }) => {
      if (!vigente) return
      if (!ok) { setError(datos.error || 'No se pudo cargar el cliente.'); setCargando(false); return }
      setPerfil(datos)
      setCargando(false)
    })
    return () => { vigente = false }
  }, [clienteId])

  function nuevoPrestamo() {
    const params = new URLSearchParams({
      clienteId: perfil.id,
      clienteNombre: perfil.nombreCompleto,
      clienteCedula: perfil.cedula,
      clienteTelefono: perfil.telefono,
    })
    navegarA(`/prestamos/nuevo?${params}`)
  }

  if (cargando) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-on-surface-variant">Cargando cliente...</p>
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-error">{error || 'Cliente no encontrado.'}</p>
      </div>
    )
  }

  const ubicacionPrincipal = perfil.ubicaciones.find(u => u.esPrincipal) ?? perfil.ubicaciones[0]

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-1.5 text-[13px]">
        <a href="/clientes" className="text-on-surface-variant no-underline hover:text-on-background transition-colors">Clientes</a>
        <span className="text-on-surface-variant">›</span>
        <span className="text-on-background font-semibold">{perfil.nombreCompleto}</span>
      </div>

      {/* Header */}
      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-6 sm:p-8 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <span className={`w-[130px] h-[130px] rounded-full flex items-center justify-center font-bold text-4xl shadow-[inset_0_3px_10px_rgba(0,40,85,0.18)] ${claseAvatar(2)}`}>
              {inicialesDe(perfil.nombreCompleto)}
            </span>
            <ChipEstado estado={perfil.estado} punto />
          </div>
          <div className="pt-1">
            <h1 className="text-2xl sm:text-[28px] font-bold text-on-background tracking-tight m-0 mb-2">{perfil.nombreCompleto}</h1>
            <p className="text-[14px] text-on-surface-variant m-0 mb-1.5">C.C. {perfil.cedula}</p>
            <p className="text-[14px] text-on-surface-variant m-0 mb-1.5 flex items-center gap-2">
              <IcoTelefono size={14} /> {perfil.telefono}
            </p>
            {ubicacionPrincipal && (
              <p className="text-[14px] text-on-surface-variant m-0 mb-2.5 flex items-center gap-2">
                <IcoPin size={14} /> {[ubicacionPrincipal.direccion, ubicacionPrincipal.ciudad].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Estrellas calificacion={perfil.calificacion} />
              {perfil.calificacion != null && <span className="text-[13px] text-on-surface-variant font-medium">{perfil.calificacion.toFixed(1)} / 5.0</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
          <span className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap ${
            perfil.stats.clienteAlDia ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-error-container text-on-error-container'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white ${perfil.stats.clienteAlDia ? 'bg-secondary' : 'bg-error'}`}>
              {perfil.stats.clienteAlDia ? <IcoCheck size={11} /> : <IcoAlerta size={11} />}
            </span>
            {perfil.stats.clienteAlDia ? 'Cliente al día' : 'Cliente en mora'}
          </span>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-outline-variant text-sm font-semibold text-on-background bg-surface-lowest cursor-not-allowed whitespace-nowrap"
          >
            <IcoEditar size={15} /> Editar cliente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <TarjetaStatChica imagen="/iconos/billetera.webp" titulo="Préstamos activos" valor={perfil.stats.prestamosActivos} />
        <TarjetaStatChica imagen="/iconos/coin.webp" titulo="Total en deuda" valor={formatearPrecio(perfil.stats.totalEnDeuda)} />
        <TarjetaStatChica imagen="/iconos/check.webp" titulo="Pagos realizados" valor={perfil.stats.pagosRealizados} />
        <TarjetaStatChica
          imagen="/iconos/clock.webp"
          titulo="Pagos pendientes"
          valor={perfil.stats.pagosPendientes.cantidad}
          subtitulo={formatearPrecio(perfil.stats.pagosPendientes.monto)}
        />
        <TarjetaStatChica imagen="/iconos/warning.webp" titulo="Veces en mora" valor={perfil.stats.vecesEnMora} peligro={perfil.stats.vecesEnMora > 0} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/50 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-background'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      {tab === 'resumen' && <ResumenTab perfil={perfil} onVerTodos={() => setTab('pagos')} />}
      {tab === 'prestamos' && (
        <TarjetaPanel icono={<IcoMoneda size={16} />} iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container" titulo="Préstamos" subtitulo="Créditos de este cliente en tu organización">
          <PrestamosTab clienteId={clienteId} />
        </TarjetaPanel>
      )}
      {tab === 'pagos' && (
        <TarjetaPanel icono={<IcoReloj size={16} />} iconoClases="bg-secondary/10 text-secondary" titulo="Pagos" subtitulo="Historial completo de movimientos">
          <PagosTab clienteId={clienteId} />
        </TarjetaPanel>
      )}
      {tab === 'documentos' && (
        <TarjetaPanel icono={<IcoArchivo size={16} />} iconoClases="bg-primary/10 text-primary" titulo="Documentos" subtitulo="Archivos cargados para este cliente">
          <DocumentosTab clienteId={clienteId} />
        </TarjetaPanel>
      )}
      {tab === 'referencias' && (
        <TarjetaPanel icono={<IcoPersonas size={16} />} iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container" titulo="Referencias personales" subtitulo="Contactos de referencia del cliente">
          <ReferenciasTab referencias={perfil.referencias} />
        </TarjetaPanel>
      )}

      {/* Footer de acciones */}
      <div className="mt-6 pt-4 border-t border-outline-variant/50 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navegarA('/clientes')}
          className="px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-background bg-transparent hover:bg-surface-default transition-colors"
        >
          ← Anterior
        </button>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled
            title="Próximamente"
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-surface-variant cursor-not-allowed"
          >
            Editar información
          </button>
          <BotonAccion variante="secundario" onClick={() => setTab('prestamos')}>
            Ver préstamos del cliente
          </BotonAccion>
          <BotonAccion onClick={nuevoPrestamo}>
            + Nuevo préstamo
          </BotonAccion>
        </div>
      </div>
    </div>
  )
}
