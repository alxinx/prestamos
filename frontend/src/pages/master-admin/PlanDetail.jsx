import { useState, useEffect } from 'react'
import DashboardMasterAdmin from '../../layouts/DashboardMasterAdmin'
import { useAuth } from '../../context/AuthContext'
import ChipEstado from '../../components/ui/ChipEstado'
import useTamanoPantalla from '../../hooks/useTamanoPantalla'
import { formatearPrecio, formatearFecha, formatearLimite, esIlimitado } from '../../lib/formato'
import { apiFetch } from '../../lib/api'
import { claseTarjeta } from '../../lib/estilos'

function idDesdePath() {
  const partes = window.location.pathname.split('/')
  return partes[partes.length - 1]
}

function FilaFeature({ icono, etiqueta, valor, destacado = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-slate-500 text-base">{icono}</span>
        <span className="text-[13px] text-slate-400">{etiqueta}</span>
      </div>
      <span className={`text-[13px] font-semibold ${destacado ? 'text-[#00C982]' : 'text-slate-200'}`}>
        {valor}
      </span>
    </div>
  )
}

function CheckFeature({ etiqueta, activo }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border
      ${activo
        ? 'bg-[rgba(0,201,130,0.06)] border-[rgba(0,201,130,0.2)]'
        : 'bg-white/[0.02] border-white/[0.06]'}`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
        ${activo ? 'bg-[rgba(0,201,130,0.2)]' : 'bg-white/[0.05]'}`}
      >
        {activo
          ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#00C982" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" /></svg>
        }
      </div>
      <span className={`text-[13px] font-medium ${activo ? 'text-slate-200' : 'text-slate-600'}`}>
        {etiqueta}
      </span>
    </div>
  )
}

function TarjetaStat({ titulo, valor, sub, color = '#aac7fd' }) {
  return (
    <div className={`${claseTarjeta} px-5 py-4`}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.06em] m-0 mb-2">{titulo}</p>
      <p className="text-[28px] font-bold m-0 leading-none" style={{ color }}>{valor}</p>
      {sub && <p className="text-[11px] text-slate-600 m-0 mt-1.5">{sub}</p>}
    </div>
  )
}

export default function PlanDetail() {
  const { autenticado, cargando: authCargando } = useAuth()
  const esMobil = useTamanoPantalla()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const planId = idDesdePath()

  useEffect(() => {
    if (authCargando || !autenticado) return
    setCargando(true)
    apiFetch(`/api/master-admin/planes/${planId}`)
      .then(({ datos }) => {
        if (datos.error) { setError(datos.error); return }
        setDatos(datos)
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setCargando(false))
  }, [authCargando, autenticado, planId])

  const { plan, statsPorEstado, ultimosTenants } = datos ?? {}
  const ingresoEstimado = plan ? (statsPorEstado?.ACTIVO ?? 0) * Number(plan.precio) : 0

  return (
    <DashboardMasterAdmin>
      <div className={`${esMobil ? 'px-4 py-5' : 'px-7 py-8'} font-sans`}>

        {/* Cabecera */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { window.location.href = '/master-admin/plans' }}
            className="flex items-center gap-1.5 bg-transparent border-none text-slate-500 text-[13px] cursor-pointer font-sans p-0 hover:text-slate-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Planes
          </button>
          <span className="text-slate-700 text-[13px]">/</span>
          <span className="text-slate-400 text-[13px]">{plan?.nombre ?? '...'}</span>
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-24">
            <div className="w-9 h-9 rounded-full border-[3px] border-[rgba(0,201,130,0.2)] [border-top-color:#00C982] animate-[girar_0.8s_linear_infinite]" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-[13px] text-red-300">
            {error}
          </div>
        )}

        {!cargando && plan && (
          <div className="flex flex-col gap-6">

            {/* Hero del plan */}
            <div className={`${claseTarjeta} overflow-hidden`}>
              <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h1 className={`${esMobil ? 'text-xl' : 'text-2xl'} font-bold text-slate-50 m-0 tracking-[-0.01em]`}>
                      {plan.nombre}
                    </h1>
                    <ChipEstado estado={plan.estado} />
                  </div>
                  <p className="text-[13px] text-slate-500 m-0">
                    Creado {formatearFecha(plan.createdAt)} · Última actualización {formatearFecha(plan.updatedAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`${esMobil ? 'text-2xl' : 'text-3xl'} font-bold text-[#00C982] m-0 leading-none`}>
                    {formatearPrecio(plan.precio)}
                  </p>
                  <p className="text-[12px] text-slate-600 m-0 mt-1">/mes por tenant</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={`grid gap-3 ${esMobil ? 'grid-cols-2' : 'grid-cols-4'}`}>
              <TarjetaStat
                titulo="Tenants totales"
                valor={plan._count.tenants}
                sub="en este plan"
                color="#aac7fd"
              />
              <TarjetaStat
                titulo="Activos"
                valor={statsPorEstado.ACTIVO}
                sub="pagando actualmente"
                color="#00C982"
              />
              <TarjetaStat
                titulo="En gracia"
                valor={statsPorEstado.PERIODO_GRACIA}
                sub="pendiente de pago"
                color="#FBBF24"
              />
              <TarjetaStat
                titulo="Ingreso estimado"
                valor={formatearPrecio(ingresoEstimado)}
                sub={`${statsPorEstado.ACTIVO} activos × ${formatearPrecio(plan.precio)}`}
                color="#aac7fd"
              />
            </div>

            <div className={`grid gap-6 ${esMobil ? 'grid-cols-1' : 'grid-cols-[1fr_1fr]'}`}>

              {/* Límites del plan */}
              <div className={`${claseTarjeta} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-[14px] font-bold text-slate-200 m-0">Límites</h2>
                </div>
                <div className="px-5 py-2">
                  <FilaFeature icono="📋" etiqueta="Préstamos activos"    valor={formatearLimite(plan.limitePrestamos)}   destacado={esIlimitado(plan.limitePrestamos)} />
                  <FilaFeature icono="👥" etiqueta="Colaboradores"        valor={formatearLimite(plan.limiteColaboradores)}  destacado={esIlimitado(plan.limiteColaboradores)} />
                  <FilaFeature icono="💬" etiqueta="Mensajes WhatsApp/mes" valor={formatearLimite(plan.limiteMensajesWsp)} destacado={esIlimitado(plan.limiteMensajesWsp)} />
                  <FilaFeature icono="📊" etiqueta="Consultas de score/mes" valor={formatearLimite(plan.consultasScore)}  destacado={esIlimitado(plan.consultasScore)} />
                  <FilaFeature icono="➕" etiqueta="Precio préstamo adicional"     valor={formatearPrecio(plan.precioPréstamoAdicional ?? 0)} />
                  <FilaFeature icono="➕" etiqueta="Precio colaborador adicional"  valor={formatearPrecio(plan.precioColaboradorAdicional ?? 0)} />
                </div>
              </div>

              {/* Funcionalidades */}
              <div className={`${claseTarjeta} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-[14px] font-bold text-slate-200 m-0">Funcionalidades</h2>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2.5">
                  <CheckFeature etiqueta="Bot de cobros automático" activo={plan.tieneBot} />
                  <CheckFeature etiqueta="Portal del cliente"       activo={plan.tienePortalCliente} />
                  <CheckFeature etiqueta="Firma digital"            activo={plan.tieneFirmaDigital} />
                </div>

                {/* Distribución por estado */}
                <div className="px-5 pb-5">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.06em] mb-3 mt-1">
                    Distribución de tenants
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Activos',      count: statsPorEstado.ACTIVO,         color: '#00C982' },
                      { label: 'En gracia',    count: statsPorEstado.PERIODO_GRACIA,  color: '#FBBF24' },
                      { label: 'Suspendidos',  count: statsPorEstado.SUSPENDIDO,      color: '#EF4444' },
                      { label: 'Cancelados',   count: statsPorEstado.CANCELADO,       color: '#64748B' },
                    ].map(({ label, count, color }) => {
                      const total = plan._count.tenants || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-semibold" style={{ color }}>{count} <span className="text-slate-600 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Últimos tenants */}
            {ultimosTenants?.length > 0 && (
              <div className={`${claseTarjeta} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-slate-200 m-0">Últimos tenants en este plan</h2>
                  <button
                    onClick={() => { window.location.href = '/master-admin/tenants' }}
                    className="text-[12px] text-[#aac7fd] bg-transparent border-none cursor-pointer font-sans hover:text-white transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Negocio', 'Estado', 'Fecha de alta'].map(col => (
                          <th key={col} className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-[0.05em]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosTenants.map(t => (
                        <tr
                          key={t.id}
                          onClick={() => { window.location.href = `/master-admin/tenants/${t.id}/panel` }}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-200">{t.nombreNegocio}</td>
                          <td className="px-5 py-3.5"><ChipEstado estado={t.estado} /></td>
                          <td className="px-5 py-3.5 text-[13px] text-slate-500">{formatearFecha(t.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardMasterAdmin>
  )
}
