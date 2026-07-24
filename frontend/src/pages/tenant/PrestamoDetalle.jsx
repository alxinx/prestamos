import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStatChica from '../../components/tenant/TarjetaStatChica'
import ChipEstado from '../../components/tenant/ChipEstado'
import BotonAccion from '../../components/tenant/BotonAccion'
import ConPermiso from '../../components/tenant/ConPermiso'
import ModalRegistrarPago from '../../components/tenant/ModalRegistrarPago'
import ModalGenerarLetraCambio from '../../components/tenant/ModalGenerarLetraCambio'
import SelectorDocumentos from '../../components/tenant/SelectorDocumentos'
import {
  IcoMoneda, IcoArchivo, IcoAlerta, IcoReloj, IcoTelefono, IcoPersonas, IcoInfo,
  IcoArchivoImagen, IcoArchivoPdf, IcoArchivoWord, IcoArchivoExcel, IcoArchivoPowerPoint,
} from '../../components/tenant/iconos'
import { formatearPrecio, formatearFechaLocal } from '../../lib/formato'
import { formatearTamanoArchivo } from '../../lib/documentos'
import { navegarA } from '../../lib/navegacion'
import { apiFetch } from '../../lib/api'
import { escribirDocumentoLetraCambio } from '../../lib/documentoLetraCambio'
import usePermisos from '../../hooks/usePermisos'

function idDesdePath() {
  return window.location.pathname.split('/')[2]
}

const TABS = [
  { id: 'plan', etiqueta: 'Plan de pagos' },
  { id: 'pagos', etiqueta: 'Pagos realizados' },
  { id: 'garantias', etiqueta: 'Garantías' },
  { id: 'deudor', etiqueta: 'Deudor solidario' },
  { id: 'documentos', etiqueta: 'Documentos' },
]

const ETIQUETAS_METODO_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata', OTRO: 'Otro' }
const ETIQUETAS_TIPO_GARANTIA = {
  MOTO: 'Moto', VEHICULO: 'Vehículo', ELECTRODOMESTICO: 'Electrodoméstico', PAGARE: 'Pagaré',
  LETRA_CAMBIO: 'Letra de cambio', DOCUMENTO_FIRMADO: 'Documento firmado', INMUEBLE: 'Inmueble', OTRO: 'Otro',
}

function SinPermiso() {
  return <p className="text-[13px] text-on-surface-variant py-6 text-center">No tienes permiso para ver esta información.</p>
}

// Texto del tooltip del ícono de información junto al valor de recargos de
// una cuota — explica de dónde sale el número (mora automática por atraso,
// recargos manuales como gastos de cobranza/penalizaciones, o ambos).
function explicacionRecargos(c) {
  const mora = Number(c.recargosMora)
  const manual = Number(c.recargosManuales)
  const partes = []
  if (mora > 0) partes.push(`${formatearPrecio(mora)} por mora del ${Number(c.porcentajeMora)}%`)
  if (manual > 0) partes.push(`${formatearPrecio(manual)} por recargos manuales (gastos de cobranza, penalizaciones u otros)`)
  if (partes.length === 0) return null
  return `Se cobran ${partes.join(' + ')}.`
}

// Tab "Plan de pagos" — cronograma cruzado con lo realmente liquidado
// (GET /creditos/:id/cronograma, ver creditos.service.js/obtenerCronogramaCredito).
// El backend ya marca `accionable` en la ÚNICA fila donde debe habilitarse
// "Registrar pago" (la primera cuota no cubierta) — nunca se puede saltar una
// cuota no saldada porque el pago nunca declara "para cuál cuota es".
function PlanPagosTab({ creditoId, refrescarClave, onRegistrarPago }) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/creditos/${creditoId}/cronograma`).then(({ ok, status, datos }) => {
      if (!vigente) return
      if (status === 403) { setSinPermiso(true); setCargando(false); return }
      if (ok) setDatos(datos)
      setCargando(false)
    })
    return () => { vigente = false }
  }, [creditoId, refrescarClave])

  if (sinPermiso) return <SinPermiso />
  if (cargando) return <p className="text-[13px] text-on-surface-variant">Cargando plan de pagos...</p>
  if (datos?.esSoloIntereses) {
    return <p className="text-[13px] text-on-surface-variant">Este crédito es de solo intereses — no tiene un plan de cuotas fijas. El capital se paga aparte cuando el cliente decida.</p>
  }
  if (!datos || datos.cuotas.length === 0) return <p className="text-[13px] text-on-surface-variant">Sin cuotas registradas.</p>

  return (
    <>
      <p className="text-[12px] text-on-surface-variant mb-3 -mt-2">Los valores son proyectados y pueden variar ante pagos anticipados.</p>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[680px] text-[13px] border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
              <th className="font-semibold px-1 pb-2">Nº</th>
              <th className="font-semibold px-1 pb-2">Fecha esperada</th>
              <th className="font-semibold px-1 pb-2">Valor cuota</th>
              <th className="font-semibold px-1 pb-2">Capital</th>
              <th className="font-semibold px-1 pb-2">Interés</th>
              <th className="font-semibold px-1 pb-2">Recargos</th>
              <th className="font-semibold px-1 pb-2">Debe</th>
              <th className="font-semibold px-1 pb-2">Estado</th>
              <th className="font-semibold px-1 pb-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {datos.cuotas.map(c => (
              <tr
                key={c.numero}
                className={`border-t border-outline-variant/40 ${c.estado === 'EN_MORA' ? 'bg-error-container/10' : ''} ${c.estado === 'PAGADO' ? 'line-through decoration-2 text-on-surface-variant/70' : ''}`}
              >
                <td className="px-1 py-3 text-on-background">{c.numero}</td>
                <td className="px-1 py-3 text-on-background whitespace-nowrap">{formatearFechaLocal(c.fecha)}</td>
                <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.valorCuota)}</td>
                <td className="px-1 py-3 text-on-surface-variant whitespace-nowrap">{formatearPrecio(c.capital)}</td>
                <td className="px-1 py-3 text-on-surface-variant whitespace-nowrap">{formatearPrecio(c.interes)}</td>
                <td className={`px-1 py-3 whitespace-nowrap overflow-visible ${Number(c.recargos) > 0 ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                  <span className="inline-flex items-center gap-1">
                    {formatearPrecio(c.recargos)}
                    {Number(c.recargos) > 0 && (
                      <span className="relative inline-flex items-center justify-center w-5 h-5 -my-1 group/tooltip cursor-help">
                        <span className="inline-flex items-center justify-center text-error/70 group-hover/tooltip:text-error shrink-0">
                          <IcoInfo size={12} />
                        </span>
                        <span className="pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity duration-100 absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 w-56 whitespace-normal rounded-lg bg-on-background text-background text-[11px] font-normal leading-snug px-2.5 py-2 shadow-card-hover">
                          {explicacionRecargos(c)}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-on-background" />
                        </span>
                      </span>
                    )}
                  </span>
                </td>
                <td className={`px-1 py-3 whitespace-nowrap font-semibold ${Number(c.totalPendiente) > 0 ? 'text-error' : 'text-secondary'}`}>
                  {formatearPrecio(c.totalPendiente)}
                </td>
                <td className="px-1 py-3">
                  <ChipEstado estado={c.estado} />
                </td>
                <td className="px-1 py-3">
                  {c.estado === 'PAGADO' ? (
                    <span className="text-[12px] font-semibold text-secondary">Pagada</span>
                  ) : c.accionable ? (
                    <ConPermiso permiso="cobros.registrar" compacto>
                      <button
                        type="button"
                        onClick={onRegistrarPago}
                        className="text-[12px] font-semibold text-error bg-transparent border-none cursor-pointer p-0 hover:underline"
                      >
                        Registrar pago
                      </button>
                    </ConPermiso>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// Tab "Pagos realizados" — todo abono se aplica al instante al registrarse
// (GET /pagos/credito/:creditoId) — ya no hay un paso de liquidación
// aparte (decisión del usuario 2026-07-23, reemplaza el flujo anterior).
function PagosRealizadosTab({ creditoId, refrescarClave, onLiquidar }) {
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [liquidando, setLiquidando] = useState(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/pagos/credito/${creditoId}?porPagina=50`).then(({ ok, status, datos }) => {
      if (!vigente) return
      if (status === 403) { setSinPermiso(true); setCargando(false); return }
      if (ok) setPagos(datos.pagos || [])
      setCargando(false)
    })
    return () => { vigente = false }
  }, [creditoId, refrescarClave])

  async function liquidar(pagoId) {
    setLiquidando(pagoId)
    await onLiquidar(pagoId)
    setLiquidando(null)
  }

  if (sinPermiso) return <SinPermiso />
  if (cargando) return <p className="text-[13px] text-on-surface-variant">Cargando pagos...</p>
  if (pagos.length === 0) return <p className="text-[13px] text-on-surface-variant">Todavía no se han registrado pagos para este crédito.</p>

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[720px] text-[13px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
            <th className="font-semibold px-1 pb-2">Fecha</th>
            <th className="font-semibold px-1 pb-2">Tipo</th>
            <th className="font-semibold px-1 pb-2">Monto</th>
            <th className="font-semibold px-1 pb-2">Método</th>
            <th className="font-semibold px-1 pb-2">Registrado por</th>
            <th className="font-semibold px-1 pb-2">Estado</th>
            <th className="font-semibold px-1 pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {pagos.map(p => (
            <tr key={p.id} className="border-t border-outline-variant/40">
              <td className="px-1 py-3 text-on-surface-variant whitespace-nowrap">{formatearFechaLocal(p.fecha)}</td>
              <td className="px-1 py-3 text-on-background">{p.etiquetaTipo}</td>
              <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(p.montoRecibido)}</td>
              <td className="px-1 py-3 text-on-background whitespace-nowrap">{ETIQUETAS_METODO_PAGO[p.metodoPago] ?? p.metodoPago}</td>
              <td className="px-1 py-3 text-on-surface-variant whitespace-nowrap">{p.registradoPor}</td>
              <td className="px-1 py-3 whitespace-nowrap"><ChipEstado estado={p.estado} /></td>
              <td className="px-1 py-3 whitespace-nowrap">
                {p.estado === 'PENDIENTE_LIQUIDAR' && (
                  <ConPermiso permiso="cobros.liquidar" compacto>
                    <button
                      type="button"
                      onClick={() => liquidar(p.id)}
                      disabled={liquidando === p.id}
                      className="px-2.5 py-1 rounded-md bg-secondary-container/25 text-on-secondary-container text-[11.5px] font-semibold cursor-pointer hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {liquidando === p.id ? 'Liquidando...' : 'Liquidar'}
                    </button>
                  </ConPermiso>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GarantiasTab({ garantias }) {
  if (garantias.length === 0) return <p className="text-[13px] text-on-surface-variant">Sin garantías registradas.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {garantias.map(g => (
        <div key={g.id} className="rounded-xl border border-outline-variant/50 p-3.5 text-[13px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-on-background">{ETIQUETAS_TIPO_GARANTIA[g.tipo] ?? g.tipo}</span>
            {g.valorEstimado != null && <span className="text-on-surface-variant">{formatearPrecio(g.valorEstimado)}</span>}
          </div>
          <p className="text-on-surface-variant m-0">{g.descripcion}</p>
        </div>
      ))}
    </div>
  )
}

function DeudorSolidarioTab({ deudores }) {
  if (deudores.length === 0) return <p className="text-[13px] text-on-surface-variant">Este crédito no tiene deudor solidario.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {deudores.map(d => (
        <div key={d.id} className="rounded-xl border border-outline-variant/50 p-3.5 text-[13px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-on-background">{d.nombreCompleto}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${d.firmoDocumento ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
              {d.firmoDocumento ? 'Firmó documento' : 'Sin firmar'}
            </span>
          </div>
          <p className="text-on-surface-variant m-0">C.C. {d.cedula} · {d.telefono}</p>
        </div>
      ))}
    </div>
  )
}

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const ICONO_POR_EXTENSION = {
  pdf: IcoArchivoPdf, doc: IcoArchivoWord, docx: IcoArchivoWord,
  xls: IcoArchivoExcel, xlsx: IcoArchivoExcel, ppt: IcoArchivoPowerPoint, pptx: IcoArchivoPowerPoint,
}
function iconoParaExtension(extension) {
  if (EXTENSIONES_IMAGEN.includes(extension)) return IcoArchivoImagen
  return ICONO_POR_EXTENSION[extension] || IcoArchivo
}

// Documentos del crédito: garantías adjuntas al otorgar + el PDF de "Resumen
// de préstamo" generado automáticamente (creditos.service.js/crearCredito) —
// mismo patrón que la pestaña Documentos de ClientePerfil.jsx.
function DocumentosTab({ creditoId, refrescarClave }) {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [documentosNuevos, setDocumentosNuevos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState('')

  async function cargar() {
    setCargando(true)
    const { ok, status, datos } = await apiFetch(`/api/tenant/creditos/${creditoId}/documentos`)
    if (status === 403) { setSinPermiso(true); setCargando(false); return }
    if (ok) setDocumentos(datos.documentos || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [creditoId, refrescarClave])

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
      const { ok, datos } = await apiFetch(`/api/tenant/creditos/${creditoId}/documentos`, { method: 'POST', body: formData })
      if (ok) subidos.push(datos.documento)
      else pendientes.push(d)
    }

    setSubiendo(false)
    setDocumentosNuevos(pendientes)
    if (subidos.length > 0) setDocumentos(actuales => [...subidos, ...actuales])
    if (pendientes.length > 0) setErrorSubida(`No se pudieron subir ${pendientes.length} documento(s). Revisa e intenta de nuevo.`)
  }

  async function abrir(documento) {
    const { ok, datos } = await apiFetch(`/api/tenant/creditos/${creditoId}/documentos/${documento.id}/descargar`)
    if (ok && datos.url) window.open(datos.url, '_blank', 'noopener,noreferrer')
  }

  if (sinPermiso) return <SinPermiso />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-3">Documentos cargados</p>
        {cargando ? (
          <p className="text-[13px] text-on-surface-variant">Cargando documentos...</p>
        ) : documentos.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">Este crédito no tiene documentos cargados.</p>
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

export default function PrestamoDetalle() {
  const creditoId = idDesdePath()
  const { tienePermiso } = usePermisos()
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('plan')
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [modalLetraAbierto, setModalLetraAbierto] = useState(false)
  const [refrescarClave, setRefrescarClave] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    apiFetch(`/api/tenant/creditos/${creditoId}`).then(({ ok, datos }) => {
      if (!vigente) return
      if (!ok) { setError(datos.error || 'No se pudo cargar el préstamo.'); setCargando(false); return }
      setDetalle(datos)
      setCargando(false)
    })
    return () => { vigente = false }
  }, [creditoId, refrescarClave])

  async function registrarPago(datos) {
    const { ok, datos: resp } = await apiFetch('/api/tenant/pagos', { method: 'POST', body: datos })
    if (ok) setRefrescarClave(c => c + 1)
    return { ok, datos: resp }
  }

  async function liquidarPago(pagoId) {
    const { ok } = await apiFetch(`/api/tenant/pagos/${pagoId}/liquidar`, { method: 'POST' })
    if (ok) setRefrescarClave(c => c + 1)
  }

  // Se pasa `ventana` (ya abierta síncronamente por el modal, dentro del gesto
  // de clic) para que documentoLetraCambio.js la rellene apenas responde la API.
  async function generarLetraCambio(datos, ventana) {
    const { ok, datos: resp } = await apiFetch(`/api/tenant/creditos/${creditoId}/letra-cambio`, {
      method: 'POST',
      body: datos,
    })
    if (!ok) throw new Error(resp.error || 'No se pudo generar la letra de cambio.')
    escribirDocumentoLetraCambio(ventana, resp)
  }

  // Solo bloquea con el skeleton la carga INICIAL (detalle === null) — un
  // refresco de fondo (refrescarClave, tras registrar/liquidar un pago) no
  // debe desmontar el árbol completo, o se pierde el estado interno de
  // ModalRegistrarPago (voucher recién generado) a mitad de la confirmación.
  if (cargando && !detalle) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-on-surface-variant">Cargando préstamo...</p>
      </div>
    )
  }

  if (error || !detalle) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-error">{error || 'Préstamo no encontrado.'}</p>
      </div>
    )
  }

  const progresoPct = detalle.montoInicial > 0
    ? Math.min(100, Math.round((Number(detalle.pagadoHastaHoy) / Number(detalle.montoInicial)) * 100 * 10) / 10)
    : 0
  const enMora = ['EN_MORA', 'VENCIDO'].includes(detalle.estado)

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-1.5 text-[13px] flex-wrap">
        <a href="/prestamos" className="text-on-surface-variant no-underline hover:text-on-background transition-colors">Préstamos</a>
        <span className="text-on-surface-variant">›</span>
        <a href={`/clientes/${detalle.cliente.id}/perfil`} className="text-on-surface-variant no-underline hover:text-on-background transition-colors">{detalle.cliente.nombreCompleto}</a>
        <span className="text-on-surface-variant">›</span>
        <span className="text-on-background font-semibold">{detalle.codigo}</span>
      </div>

      {/* Header */}
      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-6 sm:p-8 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-on-background tracking-tight m-0 mb-2">{detalle.codigo}</h1>
          <a href={`/clientes/${detalle.cliente.id}/perfil`} className="text-[14px] text-secondary font-semibold no-underline hover:underline flex items-center gap-1.5 mb-1.5">
            <IcoPersonas size={14} /> {detalle.cliente.nombreCompleto}
          </a>
          <p className="text-[13px] text-on-surface-variant m-0 mb-3 flex items-center gap-1.5">
            <IcoTelefono size={12} /> Cobrador: {detalle.cobrador.nombreCompleto}
          </p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <ChipEstado estado={detalle.estado} />
            {enMora && (
              <span className="text-[12px] font-semibold text-error flex items-center gap-1">
                <IcoAlerta size={13} /> {detalle.diasMora} días en mora
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setTab('documentos')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-background bg-surface-lowest hover:bg-surface-default transition-colors"
          >
            <IcoArchivo size={15} /> Generar PDF
          </button>
          <ConPermiso permiso="creditos.generar_letra" compacto>
            <button
              type="button"
              onClick={() => setModalLetraAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-background bg-surface-lowest hover:bg-surface-default transition-colors"
            >
              <IcoArchivo size={15} /> Generar letra de cambio
            </button>
          </ConPermiso>
          <ConPermiso permiso="cobros.registrar" compacto>
            <BotonAccion onClick={() => setModalPagoAbierto(true)} icono={<IcoMoneda size={14} />}>
              Registrar pago
            </BotonAccion>
          </ConPermiso>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <TarjetaStatChica imagen="/iconos/coin.webp" titulo="Monto original" valor={formatearPrecio(detalle.montoInicial)} />
        <TarjetaStatChica imagen="/iconos/clock.webp" titulo="Saldo pendiente" valor={formatearPrecio(detalle.saldoPendiente)} />
        <TarjetaStatChica imagen="/iconos/check.webp" titulo="Pagado hasta hoy" valor={formatearPrecio(detalle.pagadoHastaHoy)} />
        <TarjetaStatChica
          imagen="/iconos/warning.webp"
          titulo="Mora acumulada"
          valor={formatearPrecio(detalle.moraAcumulada)}
          peligro={Number(detalle.moraAcumulada) > 0}
        />
        <TarjetaStatChica
          imagen="/iconos/billetera.webp"
          titulo="Próxima cuota"
          valor={detalle.proximaCuota ? formatearFechaLocal(detalle.proximaCuota) : '—'}
          subtitulo={detalle.proximaCuota ? formatearPrecio(detalle.valorProximaCuota) : undefined}
        />
      </div>

      {/* Progreso */}
      {!detalle.esSoloIntereses && (
        <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6 mb-5">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant m-0">Progreso del crédito</p>
            <span className="text-[13px] font-bold text-secondary">{progresoPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-outline-variant/30 overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progresoPct}%`, background: 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-secondary-container) 100%)' }}
            />
          </div>
          <div className="flex items-center justify-between text-[12px] text-on-surface-variant flex-wrap gap-2">
            <span>{formatearFechaLocal(detalle.fechaInicio)} Fecha de inicio</span>
            <span>Cuotas {detalle.cuotasPagadas} de {detalle.numeroCuotas} pagadas</span>
            <span>{formatearFechaLocal(detalle.fechaVencimiento)} Fecha de vencimiento</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/50 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-background'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <TarjetaPanel
        icono={
          tab === 'plan' ? <IcoReloj size={16} /> :
          tab === 'pagos' ? <IcoMoneda size={16} /> :
          tab === 'garantias' ? <IcoArchivo size={16} /> :
          tab === 'deudor' ? <IcoPersonas size={16} /> : <IcoArchivo size={16} />
        }
        iconoClases="bg-primary/10 text-primary"
        titulo={TABS.find(t => t.id === tab)?.etiqueta}
        subtitulo={
          tab === 'plan' ? 'Cronograma de cuotas del crédito' :
          tab === 'pagos' ? 'Historial de pagos registrados y liquidados' :
          tab === 'garantias' ? 'Garantías asociadas al crédito' :
          tab === 'deudor' ? 'Deudor solidario del crédito' : 'Archivos cargados para este crédito'
        }
      >
        {tab === 'plan' && (
          <PlanPagosTab creditoId={creditoId} refrescarClave={refrescarClave} onRegistrarPago={() => setModalPagoAbierto(true)} />
        )}
        {tab === 'pagos' && (
          <PagosRealizadosTab creditoId={creditoId} refrescarClave={refrescarClave} onLiquidar={liquidarPago} />
        )}
        {tab === 'garantias' && <GarantiasTab garantias={detalle.garantias} />}
        {tab === 'deudor' && <DeudorSolidarioTab deudores={detalle.deudoresSolidarios} />}
        {tab === 'documentos' && <DocumentosTab creditoId={creditoId} refrescarClave={refrescarClave} />}
      </TarjetaPanel>

      {/* Footer de acciones */}
      <div className="mt-6 pt-4 border-t border-outline-variant/50 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navegarA('/prestamos')}
          className="px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-background bg-transparent hover:bg-surface-default transition-colors"
        >
          ← Volver
        </button>
        <div className="flex items-center gap-2.5 flex-wrap">
          <BotonAccion variante="secundario" onClick={() => navegarA(`/clientes/${detalle.cliente.id}/perfil`)}>
            Ver perfil del cliente
          </BotonAccion>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-[13px] font-semibold text-on-surface-variant cursor-not-allowed"
          >
            Refinanciar
          </button>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="px-4 py-2.5 rounded-lg border border-error/40 text-[13px] font-semibold text-error/60 cursor-not-allowed"
          >
            Marcar como castigado
          </button>
          {tienePermiso('cobros.registrar') && (
            <BotonAccion onClick={() => setModalPagoAbierto(true)} icono={<IcoMoneda size={14} />}>
              Registrar pago
            </BotonAccion>
          )}
        </div>
      </div>

      {modalPagoAbierto && (
        <ModalRegistrarPago
          credito={{ id: detalle.id, clienteNombre: detalle.cliente.nombreCompleto, montoSugerido: detalle.moraAcumulada }}
          onCerrar={() => setModalPagoAbierto(false)}
          onRegistrar={registrarPago}
        />
      )}

      {modalLetraAbierto && (
        <ModalGenerarLetraCambio
          credito={{ id: detalle.id, clienteNombre: detalle.cliente.nombreCompleto, clienteCedula: detalle.cliente.cedula }}
          onCerrar={() => setModalLetraAbierto(false)}
          onGenerar={generarLetraCambio}
        />
      )}
    </div>
  )
}
