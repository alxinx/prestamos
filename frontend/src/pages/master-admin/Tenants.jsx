import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import DashboardMasterAdmin from '../../layouts/DashboardMasterAdmin'
import { useAuth } from '../../context/AuthContext'
import ChipEstado from '../../components/ui/ChipEstado'
import ModalAlerta from '../../components/ui/ModalAlerta'
import useTamanoPantalla from '../../hooks/useTamanoPantalla'
import { formatearFecha, fechaHoyISO } from '../../lib/formato'
import { claseInput, claseLabel, claseTarjeta } from '../../lib/estilos'
import { apiFetch } from '../../lib/api'

function calcularCorte(fechaInicioStr) {
  if (!fechaInicioStr) return null
  const d = new Date(fechaInicioStr + 'T00:00:00')
  d.setDate(d.getDate() + 30)
  return d
}

// fechaInicio no va acá — se calcula al vuelo con fechaHoyISO() donde se usa
// VACIO (useState inicial y reset del formulario), nunca horneada en este
// objeto estático: de lo contrario quedaría fija en el día en que se cargó el
// módulo, no en el día real en que se abre el formulario.
const VACIO = {
  planId: '',
  nombreNegocio: '',
  tipoPersona: 'JURIDICA',
  nombreCompleto: '',
  razonSocial: '',
  tipoIdentificacion: 'NIT',
  numeroIdentificacion: '',
  email: '',
  telefono: '',
  estado: 'ACTIVO',
}

const NOMBRE_ESTADO = {
  ACTIVO:         'Activo',
  PERIODO_GRACIA: 'Período de gracia',
  SUSPENDIDO:     'Suspendido',
  CANCELADO:      'Cancelado',
}

function tipoAlertaCambioEstado(estadoNuevo) {
  if (estadoNuevo === 'CANCELADO')  return 'error'
  if (estadoNuevo === 'ACTIVO')     return 'confirmacion'
  return 'advertencia'
}

const TIPOS_ID = {
  JURIDICA: ['NIT'],
  NATURAL:  ['CC', 'CE', 'PASAPORTE'],
}

function IconoTenants() {
  return (
    <div className="w-8 h-8 rounded-lg bg-[rgba(0,201,130,0.12)] flex items-center justify-center text-admin-accent shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  )
}

function CampoBusqueda({ valor, onChange }) {
  return (
    <div className="relative mb-4">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={valor}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar por nombre, email o identificación..."
        className="w-full py-2.5 pl-9 pr-3 rounded-lg bg-white/5 border border-white/[0.08] text-slate-50 text-[13px] font-sans outline-none box-border"
      />
    </div>
  )
}

function Paginacion({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center gap-1.5 justify-end px-6 py-3.5 border-t border-white/[0.04]">
      <button
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 1}
        className={`w-[30px] h-[30px] rounded-md border-none flex items-center justify-center text-sm
          ${pagina === 1 ? 'bg-transparent text-slate-700 cursor-default' : 'bg-white/[0.06] text-slate-400 cursor-pointer hover:bg-white/10'}`}
      >
        ‹
      </button>
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-[30px] h-[30px] rounded-md border-none cursor-pointer text-[13px]
            ${n === pagina ? 'bg-admin-accent text-primary font-bold' : 'bg-white/[0.06] text-slate-400 font-normal hover:bg-white/10'}`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={pagina === totalPaginas}
        className={`w-[30px] h-[30px] rounded-md border-none flex items-center justify-center text-sm
          ${pagina === totalPaginas ? 'bg-transparent text-slate-700 cursor-default' : 'bg-white/[0.06] text-slate-400 cursor-pointer hover:bg-white/10'}`}
      >
        ›
      </button>
    </div>
  )
}

function ModalConfirmacion({ form, planes, onConfirmar, onCancelar, enviando }) {
  const planNombre = planes.find(p => p.id === form.planId)?.nombre ?? '—'
  const fechaInicio = new Date(form.fechaInicio + 'T00:00:00')
  const fechaCorte = calcularCorte(form.fechaInicio)

  useEffect(() => {
    const cerrar = e => { if (e.key === 'Escape') onCancelar() }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [onCancelar])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-[6px] flex flex-col overflow-y-auto p-6 box-border"
    >
      <div className="m-auto w-full max-w-[420px] bg-gradient-to-br from-[#0F2337] to-[#0A1A2E] border border-white/10 rounded-[20px] shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.07] flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,201,130,0.12)] flex items-center justify-center text-admin-accent shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-50 m-0">Confirmar registro</h2>
            <p className="text-[12px] text-slate-500 m-0">Verifica los datos antes de guardar</p>
          </div>
        </div>

        {/* Datos resumen */}
        <div className="px-6 py-5 flex flex-col gap-3">
          {[
            ['Negocio', form.nombreNegocio],
            ['Representante', form.nombreCompleto],
            ['Identificación', `${form.tipoIdentificacion} ${form.numeroIdentificacion}`],
            ['Email', form.email],
            ['Plan', planNombre],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <span className="text-[12px] text-slate-500 shrink-0">{k}</span>
              <span className="text-[13px] text-slate-50 font-medium text-right">{v}</span>
            </div>
          ))}

          <div className="mt-1 px-4 py-3.5 bg-[rgba(0,201,130,0.06)] border border-[rgba(0,201,130,0.15)] rounded-[10px]">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-[10px] font-semibold text-admin-accent uppercase tracking-[0.06em] m-0 mb-1">Inicia</p>
                <p className="text-[13px] font-bold text-slate-50 m-0">
                  {formatearFecha(fechaInicio)}
                </p>
              </div>
              <div className="flex-1 h-px bg-[rgba(0,201,130,0.3)] mx-3 relative top-2" />
              <div className="text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.06em] m-0 mb-1">Primer corte</p>
                <p className="text-[13px] font-bold text-slate-400 m-0">
                  {formatearFecha(fechaCorte)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 m-0 mt-2.5 text-center">
              30 días de acceso — el corte se renueva con cada pago
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="px-6 pb-5 flex gap-2.5">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[13px] font-medium cursor-pointer font-sans hover:bg-white/[0.08] hover:text-slate-50 transition-all duration-150"
          >
            Corregir
          </button>
          <button
            onClick={onConfirmar}
            disabled={enviando}
            className={`flex-1 py-2.5 rounded-lg border-none text-primary text-[13px] font-bold font-sans flex items-center justify-center gap-2 transition-all duration-150
              ${enviando ? 'bg-[rgba(0,201,130,0.4)] cursor-not-allowed' : 'bg-admin-accent cursor-pointer hover:bg-admin-accent-dark'}`}
          >
            {enviando
              ? <><span className="w-[13px] h-[13px] rounded-full border-2 border-[rgba(0,20,48,0.3)] [border-top-color:#001430] animate-[girar_0.7s_linear_infinite] inline-block" />Registrando...</>
              : 'Confirmar registro'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function FormularioTenant({ tenantEditando, onGuardado, planes }) {
  const modoEdicion = tenantEditando !== null
  const [form, setForm] = useState(() => ({ ...VACIO, fechaInicio: fechaHoyISO() }))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [alertaEstado, setAlertaEstado] = useState(false)
  const [emailEstado, setEmailEstado] = useState('idle')
  const refEmail = useRef(null)
  const timerEmail = useRef(null)

  useEffect(() => {
    if (tenantEditando) {
      const fechaIni = tenantEditando.fechaInicio
        ? new Date(tenantEditando.fechaInicio).toISOString().split('T')[0]
        : fechaHoyISO()
      setForm({
        planId: tenantEditando.planId,
        nombreNegocio: tenantEditando.nombreNegocio,
        tipoPersona: tenantEditando.tipoPersona,
        nombreCompleto: tenantEditando.nombreCompleto,
        razonSocial: tenantEditando.razonSocial ?? '',
        tipoIdentificacion: tenantEditando.tipoIdentificacion,
        numeroIdentificacion: tenantEditando.numeroIdentificacion,
        email: tenantEditando.email,
        telefono: tenantEditando.telefono ?? '',
        estado: tenantEditando.estado,
        fechaInicio: fechaIni,
      })
    } else {
      setForm({ ...VACIO, fechaInicio: fechaHoyISO() })
    }
    setError('')
    setEmailEstado('idle')
    clearTimeout(timerEmail.current)
  }, [tenantEditando])

  useEffect(() => {
    const tiposDisponibles = TIPOS_ID[form.tipoPersona] ?? []
    if (!tiposDisponibles.includes(form.tipoIdentificacion)) {
      setForm(prev => ({ ...prev, tipoIdentificacion: tiposDisponibles[0] ?? 'CC' }))
    }
  }, [form.tipoPersona])

  function cambiar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function verificarEmail(valor) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(valor)) { setEmailEstado('idle'); return }

    setEmailEstado('verificando')
    try {
      const params = new URLSearchParams({ email: valor })
      if (modoEdicion && tenantEditando?.id) params.append('excluirId', tenantEditando.id)
      const { datos: d } = await apiFetch(`/api/master-admin/tenants/verificar-email?${params}`)
      if (!d.disponible) {
        setEmailEstado('ocupado')
        setForm(prev => ({ ...prev, email: '' }))
        setTimeout(() => { refEmail.current?.focus() }, 50)
      } else {
        setEmailEstado('disponible')
      }
    } catch {
      setEmailEstado('idle')
    }
  }

  function manejarCambioEmail(valor) {
    setForm(prev => ({ ...prev, email: valor }))
    setEmailEstado('idle')
    clearTimeout(timerEmail.current)
    timerEmail.current = setTimeout(() => verificarEmail(valor), 600)
  }

  function manejarEnvioForm(e) {
    e.preventDefault()
    setError('')
    if (emailEstado === 'ocupado' || emailEstado === 'verificando') return
    if (!modoEdicion) { setConfirming(true); return }
    if (form.estado !== tenantEditando.estado) { setAlertaEstado(true); return }
    enviar()
  }

  async function enviar() {
    setEnviando(true)
    try {
      const cuerpo = {
        ...form,
        razonSocial: form.razonSocial || null,
        telefono: form.telefono || null,
        fechaInicio: new Date(form.fechaInicio + 'T00:00:00').toISOString(),
      }
      const url = modoEdicion ? `/api/master-admin/tenants/${tenantEditando.id}` : '/api/master-admin/tenants'
      const { ok, datos } = await apiFetch(url, { method: modoEdicion ? 'PUT' : 'POST', body: cuerpo })
      if (!ok) { setError(datos.error || 'Error al guardar.'); setConfirming(false); return }
      setConfirming(false)
      onGuardado()
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
      setConfirming(false)
    } finally {
      setEnviando(false)
    }
  }

  const fechaCorte = calcularCorte(form.fechaInicio)
  const campo = (label, children) => (
    <div><label className={claseLabel}>{label}</label>{children}</div>
  )

  return (
    <>
      {confirming && (
        <ModalConfirmacion
          form={form}
          planes={planes}
          onConfirmar={enviar}
          onCancelar={() => setConfirming(false)}
          enviando={enviando}
        />
      )}

      {alertaEstado && (
        <ModalAlerta
          tipo={tipoAlertaCambioEstado(form.estado)}
          titulo="¿Confirmas el cambio de estado?"
          mensaje={
            <>
              El estado pasará de{' '}
              <span className="text-slate-50 font-semibold">{NOMBRE_ESTADO[tenantEditando.estado]}</span>
              {' '}a{' '}
              <span className="text-slate-50 font-semibold">{NOMBRE_ESTADO[form.estado]}</span>.
            </>
          }
          textoConfirmar="Sí, cambiar estado"
          onConfirmar={() => { setAlertaEstado(false); enviar() }}
          onCancelar={() => setAlertaEstado(false)}
        />
      )}

      <div className={`${claseTarjeta} overflow-hidden`}>
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-2.5">
          <IconoTenants />
          <h2 className="text-[15px] font-bold text-slate-50 m-0 flex-1">
            {modoEdicion ? 'Editar tenant' : 'Registrar Nuevo Tenant'}
          </h2>
          {modoEdicion && (
            <button
              type="button"
              onClick={() => window.location.href = `/master-admin/tenants/${tenantEditando.id}/panel`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none cursor-pointer bg-secondary-container text-primary text-[12px] font-bold tracking-[0.01em] shrink-0 hover:opacity-90 transition-opacity"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Ver panel
            </button>
          )}
        </div>

        <form onSubmit={manejarEnvioForm} className="px-6 py-5 flex flex-col gap-3.5">
          {campo('Tipo de Persona',
            <select value={form.tipoPersona} onChange={e => cambiar('tipoPersona', e.target.value)} className={`${claseInput} cursor-pointer`}>
              <option value="JURIDICA">Jurídica</option>
              <option value="NATURAL">Natural</option>
            </select>
          )}

          <div className={`grid gap-3 ${form.tipoPersona === 'JURIDICA' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {campo('Nombre del Negocio',
              <input type="text" value={form.nombreNegocio} onChange={e => cambiar('nombreNegocio', e.target.value)}
                placeholder="Ej: Fintech S.A.S" required className={claseInput} />
            )}
            {form.tipoPersona === 'JURIDICA' && campo('Razón Social',
              <input type="text" value={form.razonSocial} onChange={e => cambiar('razonSocial', e.target.value)}
                placeholder="Ej: Empresa S.A.S" className={claseInput} />
            )}
          </div>

          {campo('Nombre Completo del Representante',
            <input type="text" value={form.nombreCompleto} onChange={e => cambiar('nombreCompleto', e.target.value)}
              placeholder="Ej: Juan Pérez" required className={claseInput} />
          )}

          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            {campo('Tipo Documento',
              <select value={form.tipoIdentificacion} onChange={e => cambiar('tipoIdentificacion', e.target.value)} className={`${claseInput} cursor-pointer`}>
                {(TIPOS_ID[form.tipoPersona] ?? []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            {campo('Número ID',
              <input type="text" value={form.numeroIdentificacion} onChange={e => cambiar('numeroIdentificacion', e.target.value)}
                placeholder="123456789-0" required className={claseInput} />
            )}
          </div>

          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <div>
              <label className={claseLabel}>Email Corporativo</label>
              <div className="relative">
                <input
                  ref={refEmail}
                  type="email"
                  value={form.email}
                  onChange={e => manejarCambioEmail(e.target.value)}
                  onBlur={e => { clearTimeout(timerEmail.current); verificarEmail(e.target.value) }}
                  placeholder="email@dominio.com"
                  required
                  className={`${claseInput} pr-9`}
                  style={{
                    borderColor: emailEstado === 'ocupado' ? 'rgba(239,68,68,0.6)'
                      : emailEstado === 'disponible' ? 'rgba(0,201,130,0.5)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {emailEstado === 'verificando' && (
                    <span className="w-[13px] h-[13px] rounded-full border-2 border-white/[0.15] [border-top-color:#94A3B8] animate-[girar_0.7s_linear_infinite] inline-block" />
                  )}
                  {emailEstado === 'disponible' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C982" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {emailEstado === 'ocupado' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
              </div>
              {emailEstado === 'ocupado' && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Este email ya está registrado. Ingrese uno diferente.
                </p>
              )}
            </div>
            {campo('Teléfono de Contacto',
              <input type="tel" value={form.telefono} onChange={e => cambiar('telefono', e.target.value)}
                placeholder="+57 300 0000" className={claseInput} />
            )}
          </div>

          {campo('Plan',
            <select value={form.planId} onChange={e => cambiar('planId', e.target.value)} required className={`${claseInput} cursor-pointer`}>
              <option value="">Selecciona un plan</option>
              {planes.filter(p => p.estado === 'ACTIVO').map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}

          <div>
            <label className={claseLabel}>Fecha de Inicio de Operaciones</label>
            <input type="date" value={form.fechaInicio} onChange={e => cambiar('fechaInicio', e.target.value)}
              className={`${claseInput} [color-scheme:dark]`} />
            {fechaCorte && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[rgba(0,201,130,0.06)] border border-[rgba(0,201,130,0.12)] rounded-lg">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className="text-[12px] text-slate-500">Primer corte:</span>
                <span className="text-[12px] font-bold text-admin-accent">
                  {fechaCorte.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {modoEdicion && campo('Estado',
            <select value={form.estado} onChange={e => cambiar('estado', e.target.value)} className={`${claseInput} cursor-pointer`}>
              <option value="ACTIVO">Activo</option>
              <option value="PERIODO_GRACIA">Período de gracia</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5 text-[13px] text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="py-2.5 rounded-lg border-none bg-admin-accent text-primary text-sm font-bold cursor-pointer font-sans flex items-center justify-center gap-2 mt-1 transition-all duration-150 hover:bg-admin-accent-dark"
          >
            {modoEdicion ? 'Guardar cambios' : 'Registrar Tenant'}
          </button>
        </form>
      </div>
    </>
  )
}

export default function Tenants() {
  const { autenticado, cargando: authCargando } = useAuth()
  const esMobil = useTamanoPantalla()
  const [tenants, setTenants] = useState([])
  const [planes, setPlanes] = useState([])
  const [cargandoTabla, setCargandoTabla] = useState(true)
  const [tenantEditando, setTenantEditando] = useState(null)
  const [mostrarFormMobil, setMostrarFormMobil] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 })

  const cargarPlanes = useCallback(async () => {
    if (!autenticado) return
    const { ok, datos } = await apiFetch('/api/master-admin/planes')
    if (ok) setPlanes(datos.planes)
  }, [autenticado])

  const cargarTenants = useCallback(async () => {
    if (!autenticado) return
    setCargandoTabla(true)
    try {
      const params = new URLSearchParams({ busqueda, pagina, porPagina: 10 })
      const { ok, datos } = await apiFetch(`/api/master-admin/tenants?${params}`)
      if (!ok) return
      setTenants(datos.tenants)
      setPaginacion({ total: datos.total, totalPaginas: datos.totalPaginas })
    } finally {
      setCargandoTabla(false)
    }
  }, [autenticado, busqueda, pagina])

  useEffect(() => {
    if (!authCargando && autenticado) { cargarPlanes(); cargarTenants() }
  }, [authCargando, autenticado, cargarPlanes, cargarTenants])

  useEffect(() => { setPagina(1) }, [busqueda])

  useEffect(() => {
    const editarId = new URLSearchParams(window.location.search).get('editar')
    if (!editarId || !autenticado || authCargando) return
    apiFetch(`/api/master-admin/tenants/${editarId}`)
      .then(({ datos }) => { if (datos.tenant) alEditar(datos.tenant) })
    window.history.replaceState(null, '', '/master-admin/tenants')
  }, [authCargando, autenticado])

  function alEditar(tenant) {
    setTenantEditando(tenant)
    if (esMobil) setMostrarFormMobil(true)
  }

  function alNuevo() {
    setTenantEditando(null)
    if (esMobil) setMostrarFormMobil(true)
  }

  function alGuardar() {
    setTenantEditando(null)
    if (esMobil) setMostrarFormMobil(false)
    cargarTenants()
  }

  async function eliminarUltimo() {
    const { ok, datos } = await apiFetch('/api/master-admin/tenants/dev/ultimo', { method: 'DELETE' })
    if (ok) cargarTenants()
    else alert(datos.error)
  }

  const panelLista = (
    <div className={`${claseTarjeta} overflow-hidden`}>
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconoTenants />
          <h2 className="text-[15px] font-bold text-slate-50 m-0">Listado de Tenants</h2>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              onClick={eliminarUltimo}
              title="Solo visible en desarrollo"
              className="px-2.5 py-[5px] rounded-md border border-dashed border-red-500/40 bg-red-500/[0.06] text-red-400 text-[11px] font-semibold cursor-pointer font-sans"
            >
              ⚠ Borrar último
            </button>
          )}
          {!esMobil && (
            <button
              onClick={alNuevo}
              className={`px-3.5 py-[7px] rounded-lg border-none text-[12px] font-semibold cursor-pointer font-sans transition-all duration-150
                ${tenantEditando === null
                  ? 'bg-[rgba(0,201,130,0.12)] text-admin-accent'
                  : 'bg-transparent text-slate-500 hover:bg-white/[0.06] hover:text-slate-50'
                }`}
            >
              + Nuevo tenant
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pt-4">
        <CampoBusqueda valor={busqueda} onChange={v => { setBusqueda(v); setPagina(1) }} />
      </div>

      {cargandoTabla ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 rounded-full border-[3px] border-[rgba(0,201,130,0.2)] [border-top-color:#00C982] animate-[girar_0.8s_linear_infinite] mx-auto" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 text-center text-slate-600 text-sm">
          {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay tenants registrados aún.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Nombre / Razón Social', 'Identificación', 'Plan', 'Estado', 'Operaciones', ''].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-[0.05em] whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr
                  key={t.id}
                  className="border-b border-white/[0.04] transition-colors duration-100 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-50 m-0 mb-0.5">{t.nombreNegocio}</p>
                    <p className="text-[12px] text-slate-600 m-0">{t.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
                    <span className="text-[10px] font-semibold text-slate-500 mr-1">{t.tipoIdentificacion}</span>
                    {t.numeroIdentificacion}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-slate-400">{t.plan?.nombre}</td>
                  <td className="px-4 py-3.5"><ChipEstado estado={t.estado} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 mb-[3px]">
                      <span className="text-[10px] font-semibold text-admin-accent uppercase">Inicia</span>
                      <span className="text-[12px] text-slate-400">{formatearFecha(t.fechaInicio)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-600 uppercase">Corte</span>
                      <span className="text-[12px] text-slate-500">{formatearFecha(t.fechaVencimiento)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => alEditar(t)}
                      className={`px-3 py-[5px] rounded-md border-none text-[12px] font-semibold cursor-pointer font-sans transition-all duration-150 whitespace-nowrap
                        ${tenantEditando?.id === t.id
                          ? 'bg-[rgba(0,201,130,0.15)] text-admin-accent'
                          : 'bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-slate-50'
                        }`}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-between flex-wrap gap-2">
        <p className="text-[12px] text-slate-600 m-0">
          {paginacion.total} tenant{paginacion.total !== 1 ? 's' : ''} registrado{paginacion.total !== 1 ? 's' : ''}
        </p>
        <Paginacion pagina={pagina} totalPaginas={paginacion.totalPaginas} onChange={setPagina} />
      </div>
    </div>
  )

  return (
    <DashboardMasterAdmin>
      <div className={`${esMobil ? 'px-4 py-5' : 'px-7 py-8'} font-sans`}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`${esMobil ? 'text-xl' : 'text-2xl'} font-bold text-slate-50 m-0 mb-1 tracking-[-0.01em]`}>
              Tenants
            </h1>
            <p className="text-sm text-slate-500 m-0">Gestiona los clientes registrados en la plataforma.</p>
          </div>
          {esMobil && (
            <button
              onClick={alNuevo}
              className="px-4 py-2.5 rounded-lg border-none bg-admin-accent text-primary text-[13px] font-bold cursor-pointer font-sans"
            >
              + Nuevo tenant
            </button>
          )}
        </div>

        {esMobil && mostrarFormMobil ? (
          <div>
            <button
              onClick={() => setMostrarFormMobil(false)}
              className="flex items-center gap-1.5 mb-4 bg-transparent border-none text-slate-500 text-[13px] cursor-pointer font-sans p-0"
            >
              ← Volver al listado
            </button>
            <FormularioTenant tenantEditando={tenantEditando} onGuardado={alGuardar} planes={planes} />
          </div>
        ) : (
          <div className={`${esMobil ? 'flex flex-col' : 'grid grid-cols-[3fr_2fr]'} gap-6 items-start`}>
            {panelLista}
            {!esMobil && <FormularioTenant tenantEditando={tenantEditando} onGuardado={alGuardar} planes={planes} />}
          </div>
        )}
      </div>
    </DashboardMasterAdmin>
  )
}
