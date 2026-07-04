import { useState, useEffect, useCallback } from 'react'
import DashboardMasterAdmin from '../../layouts/DashboardMasterAdmin'
import { useAuth } from '../../context/AuthContext'
import InputMoneda from '../../components/ui/InputMoneda'
import ModalAlerta from '../../components/ui/ModalAlerta'
import ChipEstado from '../../components/ui/ChipEstado'
import Toggle from '../../components/ui/Toggle'
import useTamanoPantalla from '../../hooks/useTamanoPantalla'
import { formatearPrecio } from '../../lib/formato'
import { claseInput, claseLabel } from '../../lib/estilos'

const VACIO = {
  nombre: '',
  precio: 0,
  limitePrestamos: '',
  limiteCobradores: '',
  limiteMensajesWsp: '',
  consultasScore: '',
  tieneBot: false,
  tienePortalCliente: false,
  tieneFirmaDigital: false,
  precioPrestamoAdicional: 0,
  precioColaboradorAdicional: 0,
  estado: 'ACTIVO',
}

const ILIMITADO = -1

function mostrarLimite(valor) {
  return Number(valor) === ILIMITADO ? '∞' : valor
}

function IconoCheck({ ok }) {
  return ok
    ? <span className="text-admin-accent text-[15px]">✓</span>
    : <span className="text-slate-700 text-[15px]">✗</span>
}

function IconoPlan() {
  return (
    <div className="w-8 h-8 rounded-lg bg-[rgba(0,201,130,0.12)] flex items-center justify-center text-admin-accent shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
  )
}



function CampoLimite({ label, campoValor, campoIlimitado, valorActual, ilimitadoActual, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className={claseLabel.replace('mb-1.5', '')}>{label}</label>
        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-slate-500">
          <input
            type="checkbox"
            checked={ilimitadoActual}
            onChange={e => onChange(campoIlimitado, e.target.checked)}
            className="accent-admin-accent w-[13px] h-[13px]"
          />
          Ilimitado
        </label>
      </div>
      <input
        type="number" min="0"
        value={ilimitadoActual ? '' : valorActual}
        disabled={ilimitadoActual}
        onChange={e => onChange(campoValor, e.target.value)}
        placeholder={ilimitadoActual ? '∞' : '0'}
        className={`w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm font-sans outline-none box-border
          ${ilimitadoActual ? 'bg-white/[0.03] text-slate-700' : 'bg-white/[0.06] text-slate-50'}`}
      />
    </div>
  )
}

function FormularioPlan({ planEditando, onGuardado, token }) {
  const modoEdicion = planEditando !== null
  const [form, setForm] = useState(VACIO)
  const [ilimitados, setIlimitados] = useState({ prestamos: false, cobradores: false, mensajes: false, score: false })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false)

  useEffect(() => {
    if (planEditando) {
      setForm({
        nombre: planEditando.nombre,
        precio: Number(planEditando.precio),
        limitePrestamos: planEditando.limitePrestamos === ILIMITADO ? '' : String(planEditando.limitePrestamos),
        limiteCobradores: planEditando.limiteCobradores === ILIMITADO ? '' : String(planEditando.limiteCobradores),
        limiteMensajesWsp: planEditando.limiteMensajesWsp === ILIMITADO ? '' : String(planEditando.limiteMensajesWsp),
        consultasScore: planEditando.consultasScore === ILIMITADO ? '' : String(planEditando.consultasScore),
        tieneBot: planEditando.tieneBot,
        tienePortalCliente: planEditando.tienePortalCliente,
        tieneFirmaDigital: planEditando.tieneFirmaDigital,
        precioPrestamoAdicional: Number(planEditando.precioPréstamoAdicional ?? 0),
        precioColaboradorAdicional: Number(planEditando.precioColaboradorAdicional ?? 0),
        estado: planEditando.estado,
      })
      setIlimitados({
        prestamos: planEditando.limitePrestamos === ILIMITADO,
        cobradores: planEditando.limiteCobradores === ILIMITADO,
        mensajes: planEditando.limiteMensajesWsp === ILIMITADO,
        score: planEditando.consultasScore === ILIMITADO,
      })
    } else {
      setForm(VACIO)
      setIlimitados({ prestamos: false, cobradores: false, mensajes: false, score: false })
    }
    setError('')
  }, [planEditando])

  function cambiar(campo, valor) {
    if (['ilimitadoPrestamos', 'ilimitadoCobradores', 'ilimitadoMensajes', 'ilimitadoScore'].includes(campo)) {
      const clave = campo.replace('ilimitado', '').toLowerCase()
      setIlimitados(prev => ({ ...prev, [clave]: valor }))
      return
    }
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const estadoCambio = modoEdicion && planEditando && form.estado !== planEditando.estado

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    if (estadoCambio) { setMostrarModalEstado(true); return }
    await guardar()
  }

  async function guardar() {
    setMostrarModalEstado(false)
    setEnviando(true)
    try {
      const cuerpo = {
        nombre: form.nombre.trim(),
        precio: form.precio,
        limitePrestamos: ilimitados.prestamos ? ILIMITADO : Number(form.limitePrestamos),
        limiteCobradores: ilimitados.cobradores ? ILIMITADO : Number(form.limiteCobradores),
        limiteMensajesWsp: ilimitados.mensajes ? ILIMITADO : Number(form.limiteMensajesWsp),
        consultasScore: ilimitados.score ? ILIMITADO : Number(form.consultasScore),
        tieneBot: form.tieneBot,
        tienePortalCliente: form.tienePortalCliente,
        tieneFirmaDigital: form.tieneFirmaDigital,
        precioPrestamoAdicional: form.precioPrestamoAdicional,
        precioColaboradorAdicional: form.precioColaboradorAdicional,
        estado: form.estado,
      }
      const url = modoEdicion ? `/api/master-admin/planes/${planEditando.id}` : '/api/master-admin/planes'
      const res = await fetch(url, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(cuerpo),
      })
      const datos = await res.json()
      if (!res.ok) { setError(datos.error || 'Error al guardar el plan.'); return }
      onGuardado()
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  const modalEstadoProps = form.estado === 'INACTIVO'
    ? {
        tipo: 'advertencia',
        titulo: `¿Inactivar "${form.nombre}"?`,
        mensaje: <>Este plan <span className="text-yellow-400 font-semibold">no estará disponible</span> para nuevos tenants mientras esté inactivo. Los tenants actuales con este plan no se verán afectados.</>,
        textoConfirmar: 'Sí, inactivar',
      }
    : {
        tipo: 'confirmacion',
        titulo: `¿Reactivar "${form.nombre}"?`,
        mensaje: <>Este plan <span className="text-[#00C982] font-semibold">quedará disponible al público</span> y los tenants podrán seleccionarlo nuevamente.</>,
        textoConfirmar: 'Sí, reactivar',
      }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-2.5">
        <IconoPlan />
        <h2 className="text-[15px] font-bold text-slate-50 m-0">
          {modoEdicion ? `Editar: ${planEditando.nombre}` : 'Crear Nuevo Plan'}
        </h2>
      </div>

      <form onSubmit={manejarEnvio} className="px-6 py-5 flex flex-col gap-4">
        <div>
          <label className={claseLabel}>Nombre del plan</label>
          <input type="text" value={form.nombre} onChange={e => cambiar('nombre', e.target.value)}
            placeholder="Ej: Plan Pro" required className={claseInput} />
        </div>

        <div>
          <label className={claseLabel}>Precio mensual (COP)</label>
          <InputMoneda
            valor={form.precio}
            onChange={v => cambiar('precio', v)}
            placeholder="0"
            required
            className={claseInput}
            style={{ paddingLeft: '24px' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoLimite label="Préstamos" campoValor="limitePrestamos" campoIlimitado="ilimitadoPrestamos"
            valorActual={form.limitePrestamos} ilimitadoActual={ilimitados.prestamos} onChange={cambiar} />
          <CampoLimite label="Colaboradores" campoValor="limiteCobradores" campoIlimitado="ilimitadoCobradores"
            valorActual={form.limiteCobradores} ilimitadoActual={ilimitados.cobradores} onChange={cambiar} />
          <CampoLimite label="Mensajes WhatsApp" campoValor="limiteMensajesWsp" campoIlimitado="ilimitadoMensajes"
            valorActual={form.limiteMensajesWsp} ilimitadoActual={ilimitados.mensajes} onChange={cambiar} />
          <CampoLimite label="Consultas score" campoValor="consultasScore" campoIlimitado="ilimitadoScore"
            valorActual={form.consultasScore} ilimitadoActual={ilimitados.score} onChange={cambiar} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={claseLabel}>Precio préstamo adicional (COP)</label>
            <InputMoneda
              valor={form.precioPrestamoAdicional}
              onChange={v => cambiar('precioPrestamoAdicional', v)}
              placeholder="0"
              className={claseInput}
              style={{ paddingLeft: '24px' }}
            />
          </div>
          <div>
            <label className={claseLabel}>Precio colaborador adicional (COP)</label>
            <InputMoneda
              valor={form.precioColaboradorAdicional}
              onChange={v => cambiar('precioColaboradorAdicional', v)}
              placeholder="0"
              className={claseInput}
              style={{ paddingLeft: '24px' }}
            />
          </div>
        </div>

        <div>
          <p className={`${claseLabel} mb-3`}>Funcionalidades</p>
          <div className="flex flex-col gap-2.5">
            <Toggle valor={form.tieneBot} onChange={v => cambiar('tieneBot', v)} label="Bot de WhatsApp" />
            <Toggle valor={form.tienePortalCliente} onChange={v => cambiar('tienePortalCliente', v)} label="Portal del cliente" />
            <Toggle valor={form.tieneFirmaDigital} onChange={v => cambiar('tieneFirmaDigital', v)} label="Firma digital" />
          </div>
        </div>

        {mostrarModalEstado && (
          <ModalAlerta
            {...modalEstadoProps}
            onConfirmar={guardar}
            onCancelar={() => setMostrarModalEstado(false)}
          />
        )}

        {modoEdicion && (
          <div>
            <label className={claseLabel}>Estado</label>
            <select
              value={form.estado}
              onChange={e => cambiar('estado', e.target.value)}
              className={`${claseInput} cursor-pointer`}
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5 text-[13px] text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className={`py-2.5 rounded-lg border-none text-primary text-sm font-bold font-sans flex items-center justify-center gap-2 transition-all duration-150
            ${enviando ? 'bg-[rgba(0,201,130,0.4)] cursor-not-allowed' : 'bg-admin-accent cursor-pointer hover:bg-admin-accent-dark'}`}
        >
          {enviando
            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(0,20,48,0.3)] [border-top-color:#001430] animate-[girar_0.7s_linear_infinite] inline-block" />Guardando...</>
            : modoEdicion ? 'Guardar cambios' : 'Crear plan'
          }
        </button>
      </form>
    </div>
  )
}

export default function Plans() {
  const { token, cargando: authCargando } = useAuth()
  const esMobil = useTamanoPantalla()
  const [planes, setPlanes] = useState([])
  const [cargandoTabla, setCargandoTabla] = useState(true)
  const [planEditando, setPlanEditando] = useState(null)
  const [mostrarFormMobil, setMostrarFormMobil] = useState(false)

  const cargarPlanes = useCallback(async () => {
    if (!token) return
    setCargandoTabla(true)
    try {
      const res = await fetch('/api/master-admin/planes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const datos = await res.json()
      setPlanes(datos.planes)
    } finally {
      setCargandoTabla(false)
    }
  }, [token])

  useEffect(() => {
    if (!authCargando && token) cargarPlanes()
  }, [authCargando, token, cargarPlanes])

  function alEditar(plan) {
    setPlanEditando(plan)
    if (esMobil) setMostrarFormMobil(true)
  }

  function alNuevoPlan() {
    setPlanEditando(null)
    if (esMobil) setMostrarFormMobil(true)
  }

  function alGuardar() {
    setPlanEditando(null)
    if (esMobil) setMostrarFormMobil(false)
    cargarPlanes()
  }

  return (
    <DashboardMasterAdmin>
      <div className={`${esMobil ? 'px-4 py-5' : 'px-7 py-8'} font-sans`}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`${esMobil ? 'text-xl' : 'text-2xl'} font-bold text-slate-50 m-0 mb-1 tracking-[-0.01em]`}>
              Planes
            </h1>
            <p className="text-sm text-slate-500 m-0">Gestiona los planes de suscripción disponibles.</p>
          </div>
          {esMobil && (
            <button
              onClick={alNuevoPlan}
              className="px-4 py-2.5 rounded-lg border-none bg-admin-accent text-primary text-[13px] font-bold cursor-pointer font-sans"
            >
              + Nuevo plan
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
            <FormularioPlan planEditando={planEditando} onGuardado={alGuardar} token={token} />
          </div>
        ) : (
          <div className={`${esMobil ? 'flex flex-col' : 'grid grid-cols-[3fr_2fr]'} gap-6 items-start`}>
            {/* Panel izquierdo: tabla */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconoPlan />
                  <h2 className="text-[15px] font-bold text-slate-50 m-0">Listado de Planes</h2>
                </div>
                {!esMobil && (
                  <button
                    onClick={alNuevoPlan}
                    className={`px-3.5 py-[7px] rounded-lg border-none text-[12px] font-semibold cursor-pointer font-sans transition-all duration-150
                      ${planEditando === null
                        ? 'bg-[rgba(0,201,130,0.12)] text-admin-accent'
                        : 'bg-transparent text-slate-500 hover:bg-white/[0.06] hover:text-slate-50'
                      }`}
                  >
                    + Nuevo plan
                  </button>
                )}
              </div>

              {cargandoTabla ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 rounded-full border-[3px] border-[rgba(0,201,130,0.2)] [border-top-color:#00C982] animate-[girar_0.8s_linear_infinite] mx-auto" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[520px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Plan', 'Precio', 'Préstamos', 'Colab.', 'WA / Score', 'Extras', 'Estado', ''].map(col => (
                          <th key={col} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-[0.05em] whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {planes.map(plan => (
                        <tr
                          key={plan.id}
                          className="border-b border-white/[0.04] transition-colors duration-100 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold text-slate-50">{plan.nombre}</span>
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
                            {formatearPrecio(plan.precio)}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-slate-400 text-center">
                            {mostrarLimite(plan.limitePrestamos)}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-slate-400 text-center">
                            {mostrarLimite(plan.limiteCobradores)}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-slate-400 text-center whitespace-nowrap">
                            {mostrarLimite(plan.limiteMensajesWsp)} / {mostrarLimite(plan.consultasScore)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <span title="Bot WA"><IconoCheck ok={plan.tieneBot} /></span>
                              <span title="Portal"><IconoCheck ok={plan.tienePortalCliente} /></span>
                              <span title="Firma"><IconoCheck ok={plan.tieneFirmaDigital} /></span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><ChipEstado estado={plan.estado} /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { window.location.href = `/master-admin/planes/${plan.id}` }}
                                className="px-3 py-[5px] rounded-md border-none text-[12px] font-semibold cursor-pointer font-sans transition-all duration-150 whitespace-nowrap bg-[rgba(170,199,253,0.08)] text-[#aac7fd] hover:bg-[rgba(170,199,253,0.15)]"
                              >
                                Ver plan
                              </button>
                              <button
                                onClick={() => alEditar(plan)}
                                className={`px-3 py-[5px] rounded-md border-none text-[12px] font-semibold cursor-pointer font-sans transition-all duration-150 whitespace-nowrap
                                  ${planEditando?.id === plan.id
                                    ? 'bg-[rgba(0,201,130,0.15)] text-admin-accent'
                                    : 'bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-slate-50'
                                  }`}
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-6 py-3.5 border-t border-white/[0.04]">
                <p className="text-[12px] text-slate-600 m-0">
                  {planes.length} plan{planes.length !== 1 ? 'es' : ''} registrado{planes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Panel derecho: formulario (solo desktop) */}
            {!esMobil && (
              <FormularioPlan planEditando={planEditando} onGuardado={alGuardar} token={token} />
            )}
          </div>
        )}
      </div>
    </DashboardMasterAdmin>
  )
}
