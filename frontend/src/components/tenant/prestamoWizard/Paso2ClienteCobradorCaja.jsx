import { useEffect, useState } from 'react'
import CampoSelect from '../CampoSelect'
import ConPermiso from '../ConPermiso'
import { IcoMas, IcoPersonas, IcoOjo } from '../iconos'
import { formatearPrecio } from '../../../lib/formato'
import { apiFetch } from '../../../lib/api'
import ModalDetalleCliente from './ModalDetalleCliente'

function IcoBuscarChico() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// Búsqueda de cliente por cédula o nombre — reutiliza GET /api/tenant/clientes
// (el mismo listado paginado de Clientes.jsx, con su parámetro `busqueda`) en
// vez de crear un endpoint nuevo solo para el wizard.
function BuscadorCliente({ cliente, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false)

  useEffect(() => {
    const texto = busqueda.trim()
    if (texto.length < 2) { setResultados([]); setBuscando(false); return }

    setBuscando(true)
    let vigente = true
    const idTimeout = setTimeout(async () => {
      const params = new URLSearchParams({ busqueda: texto, porPagina: '8' })
      const { ok, datos } = await apiFetch(`/api/tenant/clientes?${params}`)
      if (!vigente) return
      setBuscando(false)
      if (ok) setResultados(datos.clientes || [])
    }, 400)

    return () => { vigente = false; clearTimeout(idTimeout) }
  }, [busqueda])

  if (cliente) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-default px-4 py-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-on-background truncate m-0">{cliente.nombreCompleto}</p>
            <p className="text-[12px] text-on-surface-variant truncate m-0">CC {cliente.cedula} · {cliente.telefono}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMostrandoDetalle(true)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-on-surface-variant bg-transparent border-none cursor-pointer hover:text-on-background"
            >
              <IcoOjo size={14} /> Ver datos
            </button>
            <button
              type="button"
              onClick={() => onSeleccionar(null)}
              className="text-[12px] font-semibold text-primary bg-transparent border-none cursor-pointer hover:underline"
            >
              Cambiar
            </button>
          </div>
        </div>
        {mostrandoDetalle && (
          <ModalDetalleCliente clienteId={cliente.id} onCerrar={() => setMostrandoDetalle(false)} />
        )}
      </>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
          <IcoBuscarChico />
        </span>
        <input
          type="text"
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar por cédula o nombre"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant text-[13.5px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors"
        />
      </div>

      {abierto && busqueda.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-outline-variant bg-surface-lowest shadow-card-hover">
          {buscando ? (
            <p className="px-3 py-2.5 text-[12.5px] text-on-surface-variant m-0">Buscando...</p>
          ) : resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-[12.5px] text-on-surface-variant m-0">Sin resultados.</p>
          ) : (
            resultados.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => { onSeleccionar({ id: c.id, nombreCompleto: c.nombreCompleto, cedula: c.cedula, telefono: c.telefono }); setBusqueda('') }}
                className="w-full text-left px-3 py-2.5 hover:bg-surface-default transition-colors border-b border-outline-variant/40 last:border-0 bg-transparent"
              >
                <p className="text-[13px] font-semibold text-on-background m-0">{c.nombreCompleto}</p>
                <p className="text-[11.5px] text-on-surface-variant m-0">CC {c.cedula}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Paso2ClienteCobradorCaja({
  cliente, onSeleccionarCliente,
  cobradorId, onCambiarCobrador, cobradores,
  cajaId, onCambiarCaja, cajas,
  montoInicial, onCrearCliente,
}) {
  const cajasDisponibles = cajas.filter(c => c.estado === 'ACTIVA')
  const cajaSeleccionada = cajas.find(c => c.id === cajaId)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
              <IcoPersonas size={16} />
            </span>
            <p className="text-[14px] font-bold text-on-background m-0">Cliente *</p>
          </div>
          <ConPermiso permiso="clientes.crear" compacto>
            <button
              type="button"
              onClick={onCrearCliente}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary/50 text-secondary text-[12.5px] font-semibold cursor-pointer bg-transparent hover:bg-secondary-container/10 transition-colors"
            >
              <IcoMas size={14} /> Crear nuevo cliente
            </button>
          </ConPermiso>
        </div>
        <p className="text-[12px] text-on-surface-variant mb-3">Busca el cliente por cédula o nombre. Si no existe, podrás crearlo desde aquí.</p>
        <BuscadorCliente cliente={cliente} onSeleccionar={onSeleccionarCliente} />
      </div>

      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
        <p className="text-[14px] font-bold text-on-background mb-1">Cobrador responsable *</p>
        <p className="text-[12px] text-on-surface-variant mb-3">Selecciona el colaborador que será responsable de este préstamo.</p>
        <CampoSelect
          placeholder="Selecciona un cobrador"
          valor={cobradorId}
          onChange={onCambiarCobrador}
          opciones={cobradores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
        />
        <p className="text-[11px] text-on-surface-variant mt-1">Solo se muestran colaboradores activos con rol de COBRADOR.</p>
      </div>

      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
        <p className="text-[14px] font-bold text-on-background mb-1">Caja de capital *</p>
        <p className="text-[12px] text-on-surface-variant mb-3">Selecciona la caja de capital que financiará este préstamo.</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
          <CampoSelect
            placeholder="Selecciona una caja"
            valor={cajaId}
            onChange={onCambiarCaja}
            opciones={cajasDisponibles.map(c => ({
              value: c.id,
              label: `${c.nombre}${montoInicial > 0 && Number(c.disponible) < montoInicial ? ' (saldo insuficiente)' : ''}`,
            }))}
          />
          {cajaSeleccionada && (
            <div className="rounded-lg bg-surface-default px-4 py-2.5 sm:min-w-[220px]">
              <p className="text-[11px] text-on-surface-variant m-0 mb-0.5">Saldo disponible</p>
              <p className="text-[14px] font-bold text-secondary m-0">{formatearPrecio(cajaSeleccionada.disponible)}</p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1">Solo se muestran cajas activas — se marcan las que no alcanzan para el monto del préstamo.</p>
      </div>
    </div>
  )
}
