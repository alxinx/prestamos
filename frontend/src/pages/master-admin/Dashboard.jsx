import { useState, useEffect } from 'react'
import DashboardMasterAdmin from '../../layouts/DashboardMasterAdmin'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const kpisBase = [
  {
    etiqueta: 'Tenants Activos',
    valor: null,          // se reemplaza con dato real
    delta: '+12.4%',
    positivo: true,
    color: '#00C982',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    etiqueta: 'Ingresos del Mes',
    valor: '$48.5M',
    delta: '+8.2%',
    positivo: true,
    color: '#2DD4BF',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    etiqueta: 'Usuarios Activos',
    valor: '342',
    delta: '+5.1%',
    positivo: true,
    color: '#818CF8',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    etiqueta: 'Cuentas en Riesgo',
    valor: '23',
    delta: '-3 hoy',
    positivo: false,
    color: '#F97316',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
]

const datosCrecimiento = [38, 42, 45, 41, 55, 58, 62, 68, 72, 69, 78, 85]
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function GraficoLinea() {
  const ancho = 600
  const alto = 140
  const pad = { top: 12, right: 16, bottom: 24, left: 32 }
  const w = ancho - pad.left - pad.right
  const h = alto - pad.top - pad.bottom
  const max = Math.max(...datosCrecimiento)
  const min = Math.min(...datosCrecimiento) - 5

  const puntos = datosCrecimiento.map((v, i) => {
    const x = pad.left + (i / (datosCrecimiento.length - 1)) * w
    const y = pad.top + h - ((v - min) / (max - min)) * h
    return [x, y]
  })

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  const area = `${linea} L ${puntos[puntos.length - 1][0]} ${pad.top + h} L ${puntos[0][0]} ${pad.top + h} Z`

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full overflow-visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C982" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00C982" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.top + t * h
        return <line key={i} x1={pad.left} y1={y} x2={pad.left + w} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      })}
      <path d={area} fill="url(#areaGrad)" />
      <path d={linea} fill="none" stroke="#00C982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {puntos.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#00C982" stroke="#06182B" strokeWidth="2" />
      ))}
      {meses.map((m, i) => {
        const x = pad.left + (i / (meses.length - 1)) * w
        return (
          <text key={m} x={x} y={alto - 4} textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="Hanken Grotesk, sans-serif">
            {m}
          </text>
        )
      })}
    </svg>
  )
}

const planesDistribucion = [
  { nombre: 'Starter', porcentaje: 35, color: '#00C982' },
  { nombre: 'Growth', porcentaje: 45, color: '#2DD4BF' },
  { nombre: 'Enterprise', porcentaje: 20, color: '#818CF8' },
]

function GraficoDonut() {
  const radio = 52
  const grosor = 14
  const circunferencia = 2 * Math.PI * radio
  let acumulado = 0

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="-70 -70 140 140" className="w-[140px] h-[140px] shrink-0">
        <circle cx="0" cy="0" r={radio} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={grosor} />
        {planesDistribucion.map((plan) => {
          const longitud = (plan.porcentaje / 100) * circunferencia
          const segmento = (
            <circle
              key={plan.nombre}
              cx="0" cy="0" r={radio}
              fill="none"
              stroke={plan.color}
              strokeWidth={grosor}
              strokeDasharray={`${longitud} ${circunferencia - longitud}`}
              strokeDashoffset={-(acumulado / 100) * circunferencia + circunferencia * 0.25}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )
          acumulado += plan.porcentaje
          return segmento
        })}
        <text x="0" y="-6" textAnchor="middle" fill="#F8FAFC" fontSize="18" fontWeight="700" fontFamily="Hanken Grotesk, sans-serif">
          1.248
        </text>
        <text x="0" y="12" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Hanken Grotesk, sans-serif">
          TENANTS
        </text>
      </svg>

      <div className="flex flex-col gap-2.5 flex-1">
        {planesDistribucion.map(plan => (
          <div key={plan.nombre} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: plan.color }} />
            <span className="text-[13px] text-slate-400 flex-1">{plan.nombre}</span>
            <span className="text-[13px] font-semibold text-slate-50">{plan.porcentaje}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const estadosTenant = [
  { etiqueta: 'Activos', cantidad: 1198, color: '#00C982' },
  { etiqueta: 'Prueba', cantidad: 34, color: '#2DD4BF' },
  { etiqueta: 'Suspendidos', cantidad: 12, color: '#F97316' },
  { etiqueta: 'Morosos', cantidad: 4, color: '#EF4444' },
]

const sistemasHealth = [
  { nombre: 'API Gateway', estado: 'Operativo', latencia: '42ms', ok: true },
  { nombre: 'Cluster de Base de Datos', estado: 'Operativo', latencia: '8ms', ok: true },
  { nombre: 'Workers de Cola', estado: 'Operativo', latencia: '—', ok: true },
  { nombre: 'Servicio de Auth', estado: 'Operativo', latencia: '18ms', ok: true },
  { nombre: 'Motor de Facturación', estado: 'Degradado', latencia: '210ms', ok: false },
]

const actividadReciente = [
  { id: 'T-0891', tenant: 'Finansa SAS', accion: 'Cambio de plan', de: 'Growth', a: 'Enterprise', fecha: 'Hace 2 min', tipo: 'upgrade' },
  { id: 'T-0623', tenant: 'CreditoYa Ltda', accion: 'Nuevo registro', de: '—', a: 'Starter', fecha: 'Hace 18 min', tipo: 'new' },
  { id: 'T-0441', tenant: 'PréstamosCol', accion: 'Pago fallido', de: '—', a: '—', fecha: 'Hace 1h', tipo: 'error' },
  { id: 'T-0318', tenant: 'MicroCredit SAS', accion: 'Suspensión levantada', de: 'Suspendido', a: 'Activo', fecha: 'Hace 3h', tipo: 'restore' },
  { id: 'T-0207', tenant: 'GiroCash', accion: 'Bajada de plan', de: 'Enterprise', a: 'Growth', fecha: 'Hace 5h', tipo: 'downgrade' },
]

const colorTipo = {
  upgrade:   { text: '#00C982', bg: 'rgba(0,201,130,0.1)' },
  new:       { text: '#2DD4BF', bg: 'rgba(45,212,191,0.1)' },
  error:     { text: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  restore:   { text: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
  downgrade: { text: '#F97316', bg: 'rgba(249,115,22,0.1)' },
}

const tarjeta = 'bg-white/[0.04] border border-white/[0.07] rounded-xl backdrop-blur px-6 py-5'

export default function Dashboard() {
  const { autenticado, cargando: authCargando } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (authCargando || !autenticado) return
    apiFetch('/api/master-admin/tenants/stats')
      .then(({ datos }) => { if (!datos.error) setStats(datos) })
      .catch(() => {})
  }, [authCargando, autenticado])

  const kpis = kpisBase.map(k =>
    k.etiqueta === 'Tenants Activos'
      ? { ...k, valor: stats ? stats.porEstado.ACTIVO.toLocaleString('es-CO') : '—' }
      : k
  )

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <DashboardMasterAdmin>
      <div className="px-7 pt-8 pb-12 min-h-full bg-gradient-to-br from-[#06182B] via-[#061f2e] to-[#071a1f]">

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-slate-50 m-0 mb-1.5 tracking-[-0.02em]">
            {saludo}, Master Admin
          </h1>
          <p className="text-sm text-slate-500 m-0">
            Esto es lo que está pasando con GotaPay hoy.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {kpis.map(kpi => (
            <div key={kpi.etiqueta} className={tarjeta}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-[13px] text-slate-400 font-medium">{kpi.etiqueta}</span>
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                  style={{ background: `${kpi.color}18`, color: kpi.color }}
                >
                  {kpi.icono}
                </span>
              </div>
              <div className="text-[28px] font-bold text-slate-50 tracking-[-0.03em] mb-1.5">
                {kpi.valor}
              </div>
              <div className="text-[12px] font-semibold" style={{ color: kpi.positivo ? '#00C982' : '#F97316' }}>
                {kpi.delta} <span className="text-slate-500 font-normal">vs mes anterior</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fila: Gráfico + Estado de Tenants */}
        <div className="grid grid-cols-[1fr_320px] gap-4 mb-4">

          <div className={tarjeta}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-50 m-0 mb-1">Crecimiento de Tenants</h2>
                <p className="text-[12px] text-slate-500 m-0">Tenants activos por mes — 2025</p>
              </div>
              <span className="text-[22px] font-bold text-admin-accent tracking-[-0.02em]">+12.4%</span>
            </div>
            <GraficoLinea />
          </div>

          <div className={tarjeta}>
            <h2 className="text-[15px] font-semibold text-slate-50 m-0 mb-5">Estado de Tenants</h2>
            <div className="flex flex-col gap-3.5">
              {estadosTenant.map(est => (
                <div key={est.etiqueta}>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: est.color }} />
                      <span className="text-[13px] text-slate-400">{est.etiqueta}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-slate-50">{est.cantidad.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="h-1 rounded-sm bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-[width] duration-[0.6s] ease-out"
                      style={{ width: `${(est.cantidad / 1248) * 100}%`, background: est.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila: Distribución de Planes + Salud del Sistema */}
        <div className="grid grid-cols-[320px_1fr] gap-4 mb-4">

          <div className={tarjeta}>
            <h2 className="text-[15px] font-semibold text-slate-50 m-0 mb-5">Distribución de Planes</h2>
            <GraficoDonut />
          </div>

          <div className={tarjeta}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-slate-50 m-0">Salud del Sistema</h2>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(249,115,22,0.1)] text-[#F97316]">
                1 Degradado
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {sistemasHealth.map(s => (
                <div
                  key={s.nombre}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px]"
                  style={{
                    background: s.ok ? 'rgba(0,201,130,0.05)' : 'rgba(249,115,22,0.06)',
                    border: `1px solid ${s.ok ? 'rgba(0,201,130,0.12)' : 'rgba(249,115,22,0.15)'}`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: s.ok ? '#00C982' : '#F97316' }} />
                    <span className="text-[13px] text-slate-50">{s.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-slate-500 font-mono">{s.latencia}</span>
                    <span
                      className="text-[11px] font-semibold px-2 py-[3px] rounded-[5px]"
                      style={{
                        background: s.ok ? 'rgba(0,201,130,0.1)' : 'rgba(249,115,22,0.12)',
                        color: s.ok ? '#00C982' : '#F97316',
                      }}
                    >
                      {s.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className={tarjeta}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-slate-50 m-0">Actividad Reciente</h2>
            <a href="/master-admin/audit" className="text-[13px] text-admin-accent no-underline font-medium">
              Ver todo →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {['ID Tenant', 'Empresa', 'Acción', 'Origen', 'Destino', 'Hora'].map(col => (
                    <th key={col} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-[0.06em] border-b border-white/[0.06]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actividadReciente.map((fila, i) => (
                  <tr key={fila.id} className={i % 2 !== 0 ? 'bg-white/[0.015]' : ''}>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span className="font-mono text-[12px] text-slate-500">{fila.id}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span className="text-[13px] font-medium text-slate-50">{fila.tenant}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span
                        className="text-[11px] font-semibold px-2 py-[3px] rounded-[5px]"
                        style={{ background: colorTipo[fila.tipo].bg, color: colorTipo[fila.tipo].text }}
                      >
                        {fila.accion}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span className="text-[13px] text-slate-500">{fila.de}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span className="text-[13px] text-slate-400">{fila.a}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-white/[0.04] align-middle">
                      <span className="text-[12px] text-slate-600">{fila.fecha}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardMasterAdmin>
  )
}
