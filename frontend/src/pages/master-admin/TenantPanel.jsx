'use strict'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import DashboardMasterAdmin from '../../layouts/DashboardMasterAdmin'
import GaugeRadial from '../../components/ui/GaugeRadial'
import BarraVertical from '../../components/ui/BarraVertical'
import InputMoneda from '../../components/ui/InputMoneda'
import ChipEstado from '../../components/ui/ChipEstado'
import Toggle from '../../components/ui/Toggle'
import { useAuth } from '../../context/AuthContext'
import { formatearPrecio, formatearFecha, formatearLimite, esIlimitado, LIMITE_ILIMITADO } from '../../lib/formato'
import { apiFetch } from '../../lib/api'
import { claseTarjeta, claseInput } from '../../lib/estilos'

function diasRestantes(fecha) {
  if (!fecha) return 0
  return Math.ceil((new Date(fecha) - new Date()) / 86400000)
}

const tarjeta = `${claseTarjeta} p-5`
const claseLabel = 'text-[10px] font-bold text-slate-600 uppercase tracking-[0.08em] mb-3'
const claseLabelForm = 'text-[11px] font-bold text-slate-600 uppercase tracking-[0.07em]'

const COLORES_FACTURA = {
  PAGADO:    { bg: 'rgba(86,251,171,0.12)',  color: '#56fbab', label: 'PAGADO' },
  PENDIENTE: { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', label: 'PENDIENTE' },
  FALLIDO:   { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'FALLIDO' },
  VENCIDO:   { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'VENCIDO' },
}

const COLORES_ENGAGEMENT = {
  ACTIVO:    { color: '#56fbab', bg: 'rgba(86,251,171,0.12)',   label: 'Activo' },
  EN_RIESGO: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: 'En riesgo' },
  INACTIVO:  { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'Inactivo' },
}

function WidgetColaboradores({ plan, actividad }) {
  const limite = plan?.limiteColaboradores ?? 0
  const actual = actividad?.colaboradoresActivos ?? 0
  const pct = limite > 0 ? actual / limite : 0

  return (
    <div className={tarjeta}>
      <p className={claseLabel}>Colaboradores</p>
      <GaugeRadial valor={actual} maximo={limite} color="#56fbab" />
      <div className="text-center mt-2">
        <p className="text-lg font-bold text-slate-50 m-0">
          {actual} <span className="text-slate-600 font-normal">/ {limite}</span>
        </p>
        <p className="text-[12px] text-admin-accent m-0 mt-[3px] font-semibold">
          {limite > 0 ? `${Math.round(pct * 100)}% Capacidad` : '—'}
        </p>
      </div>
    </div>
  )
}

function WidgetPrestamos({ plan, actividad }) {
  const limite = plan?.limitePrestamos ?? 0
  const actual = actividad?.prestamosActivos ?? 0
  const pct = limite > 0 ? Math.min(1, actual / limite) : 0

  return (
    <div className={`${tarjeta} flex flex-col`}>
      <p className={claseLabel}>Préstamos Usados</p>
      <div className="flex-1 flex items-end gap-3.5">
        <BarraVertical pct={pct} color="#56fbab" altura={90} />
        <div>
          <p className="text-[22px] font-bold text-slate-50 m-0 leading-tight">
            {actual.toLocaleString('es-CO')}
          </p>
          <p className="text-[12px] text-slate-600 m-0 mt-1.5">
            Límite: {formatearLimite(limite)}
          </p>
        </div>
      </div>
    </div>
  )
}

function WidgetEngagement({ actividad }) {
  const estado = actividad?.estadoEngagement ?? 'INACTIVO'
  const eng = COLORES_ENGAGEMENT[estado] ?? COLORES_ENGAGEMENT.INACTIVO
  const pagos = actividad?.pagosUltimos30Dias ?? 0
  const barras = [0.35, 0.55, 0.45, 0.75, 0.6, Math.min(1, pagos / 60) || 0.2]

  return (
    <div className={tarjeta}>
      <p className={claseLabel}>Actividad</p>
      <span
        className="inline-flex px-2.5 py-[3px] rounded-full text-[11px] font-bold mb-2.5"
        style={{ background: eng.bg, color: eng.color }}
      >
        {eng.label}
      </span>
      <p className="text-[26px] font-bold text-slate-50 m-0 mb-3 leading-none">
        {pagos > 0 ? pagos : '—'}
        <span className="text-[13px] text-slate-600 ml-1.5 font-normal">pagos/mes</span>
      </p>
      <div className="flex gap-1 items-end h-[34px]">
        {barras.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${Math.round(h * 34)}px`,
              background: i === barras.length - 1 ? '#56fbab' : 'rgba(86,251,171,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WidgetMensajesWA({ plan }) {
  const limite = plan?.limiteMensajesWsp ?? 0
  const actual = 0
  const pct = limite > 0 ? actual / limite : 0

  return (
    <div className={tarjeta}>
      <p className={claseLabel}>Mensajes WhatsApp</p>
      <p className="text-[20px] font-bold text-slate-50 m-0 mb-1">
        {actual.toLocaleString('es-CO')}
        <span className="text-[13px] text-slate-600 font-normal ml-1.5">
          de {formatearLimite(limite)}
        </span>
      </p>
      <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden my-3">
        <div
          className="h-full rounded-full bg-admin-accent transition-[width] duration-[0.9s] ease-out"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-600 m-0">
        {plan?.tieneBot ? '● Bot activo' : '○ Sin bot'}
      </p>
    </div>
  )
}

function TarjetaPlan({ plan, seleccionado, esActual, onSeleccionar }) {
  return (
    <div
      onClick={onSeleccionar}
      className={`rounded-xl p-4 border cursor-pointer transition-all duration-150 relative select-none
        ${seleccionado
          ? 'bg-[rgba(86,251,171,0.07)] border-admin-accent'
          : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/20'
        }`}
    >
      {esActual && (
        <span className="absolute top-3 right-3 text-[9px] font-bold text-admin-accent bg-[rgba(86,251,171,0.12)] border border-[rgba(86,251,171,0.2)] px-2 py-[2px] rounded-full tracking-[0.06em]">
          ACTUAL
        </span>
      )}
      <p className="text-slate-50 font-bold text-[14px] m-0 mb-1.5 pr-14 leading-tight">{plan.nombre}</p>
      <p className="text-admin-accent font-bold text-[20px] m-0 mb-3 leading-none">
        {formatearPrecio(Number(plan.precio))}
        <span className="text-slate-600 font-normal text-[11px] ml-1">/mes</span>
      </p>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11px] text-slate-400">
          {formatearLimite(plan.limitePrestamos)} préstamos
        </span>
        <span className="text-[11px] text-slate-400">
          {formatearLimite(plan.limiteColaboradores)} colaboradores
        </span>
      </div>
    </div>
  )
}

function ModalCambiarPlan({ tenant, onCerrar, onPlanCambiado }) {
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [planSeleccionado, setPlanSeleccionado] = useState(null)
  const [paso, setPaso] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/master-admin/planes')
      .then(({ datos }) => setPlanes((datos.planes ?? []).filter(p => p.estado === 'ACTIVO')))
      .catch(() => setError('No se pudieron cargar los planes'))
      .finally(() => setCargando(false))
  }, [])

  async function confirmar() {
    setGuardando(true)
    setError('')
    try {
      const { ok, datos } = await apiFetch(`/api/master-admin/tenants/${tenant.id}`, {
        method: 'PUT',
        body: {
          planId: planSeleccionado.id,
          nombreNegocio: tenant.nombreNegocio,
          tipoPersona: tenant.tipoPersona,
          nombreCompleto: tenant.nombreCompleto,
          razonSocial: tenant.razonSocial ?? null,
          tipoIdentificacion: tenant.tipoIdentificacion,
          numeroIdentificacion: tenant.numeroIdentificacion,
          email: tenant.email,
          telefono: tenant.telefono ?? null,
          estado: tenant.estado,
          ...(tenant.fechaInicio && { fechaInicio: new Date(tenant.fechaInicio).toISOString() }),
        },
      })
      if (ok) {
        onPlanCambiado()
        onCerrar()
      } else {
        setError(datos.error || 'Error al cambiar el plan')
        setPaso(1)
      }
    } catch {
      setError('Error de conexión')
      setPaso(1)
    } finally {
      setGuardando(false)
    }
  }

  const esElMismo = planSeleccionado?.id === tenant.plan?.id

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCerrar} />
      <div
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0d1829 0%, #0a1220 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex justify-between items-center">
          <div>
            <h2 className="text-[15px] font-bold text-slate-50 m-0">Cambiar plan</h2>
            <p className="text-[12px] text-slate-600 m-0 mt-[2px]">
              Plan actual: <span className="text-slate-400 font-semibold">{tenant.plan?.nombre}</span>
            </p>
          </div>
          <button onClick={onCerrar} className="text-slate-600 hover:text-slate-300 bg-transparent border-none cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        {paso === 1 ? (
          <div className="px-6 pt-5 pb-3">
            {cargando ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 rounded-full border-[3px] border-[rgba(86,251,171,0.15)] [border-top-color:#56fbab] animate-[girar_0.7s_linear_infinite]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {planes.map(plan => (
                  <TarjetaPlan
                    key={plan.id}
                    plan={plan}
                    seleccionado={planSeleccionado?.id === plan.id}
                    esActual={plan.id === tenant.plan?.id}
                    onSeleccionar={() => setPlanSeleccionado(plan)}
                  />
                ))}
              </div>
            )}
            {error && <p className="text-[12px] text-red-300 mt-3 m-0">{error}</p>}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-slate-50 m-0 mb-2">¿Confirmas el cambio de plan?</h3>
            <p className="text-[13px] text-slate-400 m-0">
              El plan pasará de{' '}
              <span className="text-slate-50 font-semibold">{tenant.plan?.nombre}</span>
              {' '}a{' '}
              <span className="text-admin-accent font-semibold">{planSeleccionado?.nombre}</span>.
            </p>
            {error && <p className="text-[12px] text-red-300 mt-3 m-0">{error}</p>}
          </div>
        )}

        {/* Pie */}
        <div className="px-6 py-5 flex gap-2.5 justify-end">
          <button
            onClick={paso === 1 ? onCerrar : () => setPaso(1)}
            className="px-4 py-[9px] rounded-lg border border-white/[0.08] bg-transparent text-slate-400 text-[13px] font-semibold cursor-pointer hover:bg-white/[0.04] transition-colors"
          >
            {paso === 1 ? 'Cancelar' : 'Volver'}
          </button>
          {paso === 1 ? (
            <button
              onClick={() => setPaso(2)}
              disabled={!planSeleccionado || esElMismo}
              className={`px-4 py-[9px] rounded-lg text-[13px] font-semibold transition-colors
                ${!planSeleccionado || esElMismo
                  ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed border border-white/[0.05]'
                  : 'bg-primary text-slate-50 border border-white/[0.08] hover:bg-primary-container cursor-pointer'
                }`}
            >
              Confirmar cambio
            </button>
          ) : (
            <button
              onClick={confirmar}
              disabled={guardando}
              className="px-4 py-[9px] rounded-lg bg-primary text-slate-50 text-[13px] font-semibold cursor-pointer border border-white/[0.08] hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Aplicando...' : 'Aceptar'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Devuelve estilos de alerta crítica interpolando naranja claro → rojo según los días restantes.
// Retorna null si dias > 5 (sin alerta crítica).
function estiloAlertaDias(dias) {
  if (dias > 5) return null
  const t = Math.max(0, Math.min(5, dias)) / 5   // 0 = rojo puro, 1 = naranja
  const r1 = Math.round(220 + t * 31)             // 220 → 251
  const g1 = Math.round(38  + t * 108)            // 38  → 146
  const b1 = Math.round(38  + t * 22)             // 38  → 60
  const r2 = Math.round(170 + t * 20)
  const g2 = Math.round(20  + t * 50)
  const b2 = Math.round(20  + t * 15)
  return {
    fondo: `linear-gradient(145deg, rgba(${r1},${g1},${b1},0.88) 0%, rgba(${r2},${g2},${b2},0.95) 100%)`,
    borde: `rgba(${r1},${g1},${b1},0.35)`,
  }
}

function WidgetSuscripcion({ tenant, dias, onCambiarPlan }) {
  const critico = estiloAlertaDias(dias)
  const esCritico = critico !== null
  const colorNumero = esCritico ? '#ffffff' : dias <= 15 ? '#FBBF24' : '#F8FAFC'

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden border"
      style={{
        background: critico?.fondo ?? 'linear-gradient(145deg, rgba(0,28,64,0.85) 0%, rgba(0,16,40,0.9) 100%)',
        borderColor: critico?.borde ?? 'rgba(170,199,253,0.12)',
      }}
    >
      <p className={claseLabel} style={esCritico ? { color: 'rgba(255,255,255,0.45)' } : {}}>
        Suscripción
      </p>
      <p className="text-[40px] font-bold m-0 mb-1 leading-none" style={{ color: colorNumero }}>
        {Math.max(0, dias)}
        <span
          className="text-[14px] ml-1.5 font-normal"
          style={{ color: esCritico ? 'rgba(255,255,255,0.6)' : '#475569' }}
        >
          días
        </span>
      </p>
      <span
        className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.07em] mb-3"
        style={
          esCritico
            ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }
            : { background: 'rgba(86,251,171,0.1)', color: '#56fbab' }
        }
      >
        {tenant.plan?.nombre?.toUpperCase() ?? 'SIN PLAN'}
      </span>
      <br />
      <button
        onClick={onCambiarPlan}
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 text-[12px] font-semibold font-sans"
        style={{ color: esCritico ? 'rgba(255,255,255,0.75)' : '#478dff' }}
      >
        Cambiar plan
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}

function HistorialFacturacion({ facturas }) {
  return (
    <div className={`${claseTarjeta} overflow-hidden`}>
      <div className="px-6 py-[18px] border-b border-white/[0.06] flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-50 m-0">Historial de facturación</h3>
        <button className="text-[12px] text-on-tertiary-container bg-transparent border-none cursor-pointer font-sans">
          Ver todo
        </button>
      </div>

      {facturas.length === 0 ? (
        <div className="p-8 text-center text-slate-600 text-[13px]">
          Sin facturas registradas aún.
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              {['FECHA', 'FACTURA #', 'MONTO', 'ESTADO'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase tracking-[0.06em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturas.map(f => {
              const chip = COLORES_FACTURA[f.estado] ?? COLORES_FACTURA.PENDIENTE
              return (
                <tr key={f.id} className="border-b border-white/[0.04] transition-colors duration-100 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{formatearFecha(f.fechaGeneracion)}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-50">{f.periodo}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-50 font-semibold">{formatearPrecio(f.totalFactura)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-[3px] rounded-full text-[10px] font-bold"
                      style={{ background: chip.bg, color: chip.color }}
                    >
                      {chip.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function SaludSistema({ tenant }) {
  const activado = !tenant.tokenActivacion
  const dias = diasRestantes(tenant.fechaVencimiento)

  let estadoLabel = 'Optimizado'
  let estadoColor = '#56fbab'
  if (!activado) { estadoLabel = 'Sin activar'; estadoColor = '#FBBF24' }
  else if (dias <= 0) { estadoLabel = 'Vencido'; estadoColor = '#EF4444' }
  else if (dias <= 5) { estadoLabel = 'Crítico'; estadoColor = '#EF4444' }
  else if (dias <= 15) { estadoLabel = 'Atención requerida'; estadoColor = '#FBBF24' }

  return (
    <div className="rounded-xl px-6 py-[22px] relative overflow-hidden border border-white/[0.07]"
      style={{ background: 'linear-gradient(135deg, rgba(0,40,85,0.65) 0%, rgba(0,20,48,0.75) 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 75% 25%, rgba(86,251,171,0.07) 0%, transparent 55%)' }} />
      <h4 className="text-sm font-bold text-slate-50 m-0 mb-1">Estado del sistema</h4>
      <p className="text-[12px] text-slate-600 m-0 mb-4">
        Estado del nodo: <span className="font-semibold" style={{ color: estadoColor }}>{estadoLabel}</span>
      </p>
      <button className="px-4 py-[7px] rounded-lg border-none bg-[rgba(86,251,171,0.14)] text-admin-accent text-[12px] font-bold cursor-pointer font-sans tracking-[0.04em]">
        Reescanear nodo
      </button>
    </div>
  )
}

function CampoLimite({ label, campo, campoBool, rawLimites, cambiarRaw, confirmarRaw, cfg, cambiar, claseInputRef = claseInput }) {
  const deshabilitado = !!(campoBool && cfg[campoBool])
  return (
    <div>
      <div className="flex justify-between items-center mb-[7px]">
        <label className={claseLabelForm}>{label}</label>
        {campoBool && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Toggle valor={cfg[campoBool]} onChange={v => cambiar(campoBool, v)} />
            <span className={`text-[10px] font-bold ${cfg[campoBool] ? 'text-admin-accent' : 'text-slate-600'}`}>
              ILIMITADO
            </span>
          </label>
        )}
      </div>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={deshabilitado ? '' : (rawLimites[campo] ?? '')}
        onChange={e => { if (!deshabilitado) cambiarRaw(campo, e.target.value) }}
        onBlur={() => { if (!deshabilitado) confirmarRaw(campo) }}
        disabled={deshabilitado}
        className={`${claseInputRef} ${deshabilitado ? 'opacity-35 cursor-not-allowed' : 'cursor-text'}`}
      />
    </div>
  )
}

function CampoPrecio({ label, valor, onChange, claseInputRef = claseInput }) {
  return (
    <div>
      <label className={`${claseLabelForm} block mb-[7px]`}>{label}</label>
      <InputMoneda valor={valor} onChange={onChange} className={claseInputRef} style={{ paddingLeft: '28px' }} />
    </div>
  )
}

function ConfiguracionAvanzada({ tenant, onGuardado }) {
  const plan = tenant.plan

  const precioBase = Number(plan?.precio ?? 0)
  const limitePrestamosBase = esIlimitado(plan?.limitePrestamos) ? Infinity : (plan?.limitePrestamos ?? 0)
  const limiteColaboradoresBase = esIlimitado(plan?.limiteColaboradores) ? Infinity : (plan?.limiteColaboradores ?? 0)

  const [cfg, setCfg] = useState({
    precio: Number(plan?.precio ?? 0),
    prestamos: esIlimitado(plan?.limitePrestamos) ? 0 : (plan?.limitePrestamos ?? 0),
    prestamosIlimitado: esIlimitado(plan?.limitePrestamos),
    colaboradores: esIlimitado(plan?.limiteColaboradores) ? 0 : (plan?.limiteColaboradores ?? 0),
    colaboradoresIlimitado: esIlimitado(plan?.limiteColaboradores),
    mensajesWsp: esIlimitado(plan?.limiteMensajesWsp) ? 0 : (plan?.limiteMensajesWsp ?? 0),
    mensajesWspIlimitado: esIlimitado(plan?.limiteMensajesWsp),
    consultasScore: esIlimitado(plan?.consultasScore) ? 0 : (plan?.consultasScore ?? 0),
    consultasScoreIlimitado: esIlimitado(plan?.consultasScore),
    precioAdicional: Number(plan?.precioPréstamoAdicional ?? 0),
    precioColaboradorAdicional: Number(plan?.precioColaboradorAdicional ?? 0),
  })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [rawLimites, setRawLimites] = useState({
    prestamos: String(cfg.prestamos),
    colaboradores: String(cfg.colaboradores),
    mensajesWsp: String(cfg.mensajesWsp),
    consultasScore: String(cfg.consultasScore),
  })

  // Recalcula el precio cuando cambian los límites o los precios unitarios
  useEffect(() => {
    const extraPrestamos = cfg.prestamosIlimitado
      ? 0
      : Math.max(0, cfg.prestamos - limitePrestamosBase) * cfg.precioAdicional
    const extraColaboradores = cfg.colaboradoresIlimitado
      ? 0
      : Math.max(0, cfg.colaboradores - limiteColaboradoresBase) * cfg.precioColaboradorAdicional
    setCfg(prev => ({ ...prev, precio: precioBase + extraPrestamos + extraColaboradores }))
  }, [cfg.prestamos, cfg.colaboradores, cfg.prestamosIlimitado, cfg.colaboradoresIlimitado, cfg.precioAdicional, cfg.precioColaboradorAdicional]) // eslint-disable-line

  const extraPrestamos = cfg.prestamosIlimitado ? 0 : Math.max(0, cfg.prestamos - limitePrestamosBase)
  const extraColaboradores = cfg.colaboradoresIlimitado ? 0 : Math.max(0, cfg.colaboradores - limiteColaboradoresBase)

  function cambiar(campo, valor) {
    setCfg(prev => ({ ...prev, [campo]: valor }))
    setGuardado(false)
    setErrorGuardado('')
  }

  function cambiarRaw(campo, texto) {
    setRawLimites(prev => ({ ...prev, [campo]: texto.replace(/[^0-9]/g, '') }))
  }

  function confirmarRaw(campo) {
    const n = parseInt(rawLimites[campo], 10)
    const valor = isNaN(n) ? 0 : n
    setRawLimites(prev => ({ ...prev, [campo]: String(valor) }))
    cambiar(campo, valor)
  }

  async function guardar() {
    setGuardando(true)
    setErrorGuardado('')
    try {
      const { ok, datos } = await apiFetch(`/api/master-admin/planes/${plan.id}/config`, {
        method: 'PATCH',
        body: {
          precio: cfg.precio,
          limitePrestamos: cfg.prestamosIlimitado ? LIMITE_ILIMITADO : cfg.prestamos,
          limiteColaboradores: cfg.colaboradoresIlimitado ? LIMITE_ILIMITADO : cfg.colaboradores,
          limiteMensajesWsp: cfg.mensajesWspIlimitado ? LIMITE_ILIMITADO : cfg.mensajesWsp,
          consultasScore: cfg.consultasScoreIlimitado ? LIMITE_ILIMITADO : cfg.consultasScore,
          precioPrestamoAdicional: cfg.precioAdicional,
          precioColaboradorAdicional: cfg.precioColaboradorAdicional,
        },
      })
      if (ok) {
        setGuardado(true)
        setTimeout(() => setGuardado(false), 3000)
        if (onGuardado) onGuardado()
      } else {
        setErrorGuardado(datos.error || 'Error al guardar')
      }
    } catch {
      setErrorGuardado('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const claseInputGrande = `${claseInput} text-xl font-bold py-3.5`
  const propsCampo = { rawLimites, cambiarRaw, confirmarRaw, cfg, cambiar, claseInputRef: claseInputGrande }

  return (
    <div className={`${claseTarjeta} overflow-hidden`}>
      <div className="px-6 py-[18px] border-b border-white/[0.06]">
        <h3 className="text-sm font-bold text-slate-50 m-0">Configuración avanzada</h3>
        <p className="text-[12px] text-slate-600 m-0 mt-[3px]">
          Plan: <span className="text-slate-400 font-semibold">{plan?.nombre}</span>
        </p>
      </div>

      <div className="px-6 py-[22px] flex flex-col gap-4">
        <div>
          <CampoPrecio label="Precio Mensual (COP)" valor={cfg.precio} onChange={v => cambiar('precio', v)} claseInputRef={claseInputGrande} />
          {(extraPrestamos > 0 || extraColaboradores > 0) && (
            <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1">
              <p className="m-0 text-[12px] text-slate-600">
                Base: <span className="text-slate-300 font-semibold">{formatearPrecio(precioBase)}</span>
              </p>
              {extraPrestamos > 0 && (
                <p className="m-0 text-[12px] text-admin-accent">
                  + {extraPrestamos} préstamos × <span className="font-semibold">{formatearPrecio(cfg.precioAdicional)}</span>
                  <span className="text-slate-500"> = <span className="text-slate-300 font-bold">{formatearPrecio(extraPrestamos * cfg.precioAdicional)}</span></span>
                </p>
              )}
              {extraColaboradores > 0 && (
                <p className="m-0 text-[12px] text-on-tertiary-container">
                  + {extraColaboradores} colaboradores × <span className="font-semibold">{formatearPrecio(cfg.precioColaboradorAdicional)}</span>
                  <span className="text-slate-500"> = <span className="text-slate-300 font-bold">{formatearPrecio(extraColaboradores * cfg.precioColaboradorAdicional)}</span></span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <CampoLimite {...propsCampo} label="Préstamos"       campo="prestamos"     campoBool="prestamosIlimitado" />
          <CampoLimite {...propsCampo} label="Colaboradores"   campo="colaboradores" campoBool="colaboradoresIlimitado" />
          <CampoLimite {...propsCampo} label="Mens. WhatsApp"  campo="mensajesWsp"   campoBool="mensajesWspIlimitado" />
          <CampoLimite {...propsCampo} label="Consultas Score" campo="consultasScore" campoBool="consultasScoreIlimitado" />
        </div>

        {errorGuardado && (
          <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-300">
            {errorGuardado}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={guardando}
          className={`py-[11px] rounded-lg text-[13px] font-bold cursor-pointer font-sans flex items-center justify-center gap-2 transition-all duration-200
            ${guardado
              ? 'bg-[rgba(86,251,171,0.35)] text-admin-accent border border-[rgba(86,251,171,0.3)]'
              : guardando
                ? 'bg-[rgba(86,251,171,0.25)] text-slate-50 border border-white/[0.08] cursor-not-allowed'
                : 'bg-primary text-slate-50 border border-white/[0.08] hover:bg-primary-container'
            }`}
        >
          {guardado ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Cambios aplicados
            </>
          ) : guardando ? 'Aplicando...' : 'Aplicar cambios'}
        </button>

        <p className="text-[11px] text-slate-700 m-0 text-center">
          Afecta a todos los tenants en el plan "{plan?.nombre}"
        </p>
      </div>
    </div>
  )
}

export default function TenantPanel() {
  const { autenticado, cargando: authCargando } = useAuth()
  const [tenant, setTenant] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarModalPlan, setMostrarModalPlan] = useState(false)

  const tenantId = window.location.pathname.split('/')[3]

  const cargar = useCallback(async () => {
    if (!autenticado) return
    setCargando(true)
    try {
      const { ok, datos } = await apiFetch(`/api/master-admin/tenants/${tenantId}`)
      if (ok) setTenant(datos.tenant)
    } finally {
      setCargando(false)
    }
  }, [autenticado, tenantId])

  useEffect(() => {
    if (!authCargando && autenticado) cargar()
  }, [authCargando, autenticado, cargar])

  if (authCargando || cargando) {
    return (
      <DashboardMasterAdmin>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-[rgba(86,251,171,0.15)] [border-top-color:#56fbab] animate-[girar_0.7s_linear_infinite]" />
        </div>
      </DashboardMasterAdmin>
    )
  }

  if (!tenant) {
    return (
      <DashboardMasterAdmin>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <p className="text-slate-400 text-sm">Tenant no encontrado.</p>
          <button
            onClick={() => window.location.href = '/master-admin/tenants'}
            className="text-[13px] text-admin-accent bg-transparent border-none cursor-pointer underline font-sans"
          >
            ← Volver a tenants
          </button>
        </div>
      </DashboardMasterAdmin>
    )
  }

  const dias = diasRestantes(tenant.fechaVencimiento)
  const actividad = tenant.actividadResumen
  const facturas = tenant.facturas ?? []

  return (
    <DashboardMasterAdmin>
      <div className="px-8 py-7 font-sans">

        {/* Header */}
        <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={() => window.location.href = '/master-admin/tenants'}
                className="bg-transparent border-none cursor-pointer text-slate-600 text-[13px] p-0 font-sans"
              >
                Tenants
              </button>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-slate-600 text-[13px]">{tenant.nombreNegocio}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-50 m-0 mb-[5px] tracking-[-0.01em]">
              Tenant Analytics & Config
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] text-slate-600 m-0">
                Gestión detallada de{' '}
                <span className="text-slate-400 font-semibold">{tenant.nombreNegocio}</span>
              </p>
              <ChipEstado estado={tenant.estado} />
            </div>
          </div>

          <button
            onClick={() => window.location.href = `/master-admin/tenants?editar=${tenantId}`}
            className="flex items-center gap-1.5 px-4 py-[9px] rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 text-[13px] font-semibold cursor-pointer font-sans hover:bg-white/[0.07] hover:text-slate-50 transition-colors duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar auditoría
          </button>
        </div>

        {/* Fila de estadísticas */}
        <div className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: '1.7fr 1.3fr 2fr 1.8fr 1.7fr' }}>
          <WidgetColaboradores plan={tenant.plan} actividad={actividad} />
          <WidgetPrestamos plan={tenant.plan} actividad={actividad} />
          <WidgetEngagement actividad={actividad} />
          <WidgetMensajesWA plan={tenant.plan} />
          <WidgetSuscripcion tenant={tenant} dias={dias} onCambiarPlan={() => setMostrarModalPlan(true)} />
        </div>

        {/* Cuerpo (2 columnas) */}
        <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
          <div className="flex flex-col gap-4">
            <HistorialFacturacion facturas={facturas} />
            <SaludSistema tenant={tenant} />
          </div>
          <ConfiguracionAvanzada tenant={tenant} onGuardado={cargar} />
        </div>

      </div>

      {mostrarModalPlan && (
        <ModalCambiarPlan
          tenant={tenant}
          onCerrar={() => setMostrarModalPlan(false)}
          onPlanCambiado={cargar}
        />
      )}
    </DashboardMasterAdmin>
  )
}
