import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { formatearPrecio, formatearLimite } from '../../lib/formato'
import { RECURSOS_LIMITE_PLAN } from '../../lib/limitePlan'
import { IcoCheck, IcoX, IcoPersonas, IcoCorreo, IcoBuscar, IcoEstrella } from './iconos'

function IcoFlecha({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// Ícono e info de venta por plan — heurística por nombre (tolera mayúsculas o
// tildes), con un genérico de respaldo para cualquier plan futuro que master-
// admin cree con otro nombre. Los íconos ya existen en public/iconos/ y
// coinciden con los planes reales (Básicos/Pro/Enterprise).
function infoVentaPlan(nombre) {
  const n = nombre.toLowerCase()
  if (n.includes('enterprise') || n.includes('empresa')) {
    return { icono: '/iconos/enterprise.webp', descripcion: 'Máximo poder para grandes operaciones.' }
  }
  if (n.includes('pro')) {
    return { icono: '/iconos/pro.webp', descripcion: 'Para prestamistas con operación en crecimiento.' }
  }
  if (n.includes('bás') || n.includes('bas')) {
    return { icono: '/iconos/basico.webp', descripcion: 'Ideal para prestamistas que están comenzando.' }
  }
  return { icono: '/iconos/basico.webp', descripcion: 'Un plan a la medida de tu operación.' }
}

function FilaMetrica({ icono, etiqueta, valor }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-on-surface-variant">
        {icono}{etiqueta}
      </span>
      <span className="font-bold text-on-background">{valor}</span>
    </div>
  )
}

function FilaFeature({ etiqueta, activo }) {
  return (
    <div className="flex items-center gap-2">
      <span className={activo ? 'text-secondary' : 'text-outline-variant'}>
        {activo ? <IcoCheck size={13} /> : <IcoX size={13} />}
      </span>
      <span className={activo ? 'text-on-background' : 'text-on-surface-variant'}>{etiqueta}</span>
    </div>
  )
}

function TarjetaPlan({ plan, esActual, esRecomendado }) {
  const { icono, descripcion } = infoVentaPlan(plan.nombre)

  return (
    <div className={`rounded-2xl bg-surface-lowest shadow-card p-5 flex flex-col gap-4 ${esRecomendado ? 'border-2 border-secondary' : 'border border-outline-variant/50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {esRecomendado && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-secondary text-white">
              <IcoEstrella size={11} lleno={false} /> Recomendado
            </span>
          )}
          {esActual && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-outline-variant/35 text-on-surface-variant">
              Tu plan actual
            </span>
          )}
        </div>
        <img src={icono} alt="" className="w-11 h-11 shrink-0 select-none pointer-events-none" />
      </div>

      <div>
        <p className="text-[16px] font-bold text-on-background m-0">{plan.nombre}</p>
        <p className="text-[26px] font-bold text-on-background m-0 mt-1">
          {formatearPrecio(plan.precio)}<span className="text-[12.5px] font-medium text-on-surface-variant"> /mes</span>
        </p>
        <p className="text-[12.5px] text-on-surface-variant mt-1 mb-0">{descripcion}</p>
      </div>

      <div className="rounded-xl bg-secondary-container/20 px-3.5 py-2.5 flex items-center gap-2.5">
        <span className="text-secondary shrink-0"><IcoPersonas size={17} /></span>
        <div>
          <p className="text-[11px] text-on-surface-variant m-0">Préstamos activos</p>
          <p className="text-[17px] font-bold text-secondary m-0">{formatearLimite(plan.limitePrestamos)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-[12.5px]">
        <FilaMetrica icono={<IcoPersonas size={13} />} etiqueta="Colaboradores" valor={formatearLimite(plan.limiteColaboradores)} />
        <FilaMetrica icono={<IcoCorreo size={13} />} etiqueta="Mensajes WhatsApp" valor={formatearLimite(plan.limiteMensajesWsp)} />
        <FilaMetrica icono={<IcoBuscar size={13} />} etiqueta="Consultas de score" valor={formatearLimite(plan.consultasScore)} />
      </div>

      <div className="flex flex-col gap-1.5 pt-3 border-t border-outline-variant/40 text-[12.5px]">
        <FilaFeature etiqueta="Bot de WhatsApp" activo={plan.tieneBot} />
        <FilaFeature etiqueta="Portal del cliente" activo={plan.tienePortalCliente} />
        <FilaFeature etiqueta="Firma digital" activo={plan.tieneFirmaDigital} />
      </div>

      {esActual ? (
        <span className="w-full text-center py-2.5 rounded-lg border-2 border-secondary text-secondary text-[13.5px] font-bold">
          Plan actual
        </span>
      ) : (
        <button
          type="button"
          className="w-full py-2.5 rounded-lg bg-secondary text-white text-[13.5px] font-bold cursor-pointer hover:brightness-110 transition-all inline-flex items-center justify-center gap-1.5"
        >
          Elegir plan {plan.nombre} <IcoFlecha size={14} />
        </button>
      )}
    </div>
  )
}

// Grid de tarjetas de planes (tabla Plan real, GET /api/tenant/plan/opciones —
// nunca datos inventados) — usado tanto por AvisoLimitePlan (bloque completo
// del wizard "Nuevo préstamo") como por ModalPlanes (modal del panel
// "Colaboradores"). `recurso` decide contra qué campo del plan se calcula el
// "Recomendado" (el más barato, distinto del actual, que sí resuelve el cupo).
export default function GridPlanes({ usados, recurso = 'prestamos' }) {
  const [planes, setPlanes] = useState([])
  const [planActualId, setPlanActualId] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    apiFetch('/api/tenant/plan/opciones').then(({ ok, datos }) => {
      if (ok) {
        setPlanes(datos.planes || [])
        setPlanActualId(datos.planActualId)
      }
      setCargando(false)
    })
  }, [])

  const campoLimite = RECURSOS_LIMITE_PLAN[recurso].campoLimite
  const idRecomendado = planes.find(
    p => p.id !== planActualId && (Number(p[campoLimite]) === -1 || Number(p[campoLimite]) > usados)
  )?.id

  if (cargando) {
    return (
      <div className="py-10 text-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-secondary-container/30 [border-top-color:var(--color-secondary)] animate-[girar_0.8s_linear_infinite] mx-auto" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {planes.map(plan => (
        <TarjetaPlan key={plan.id} plan={plan} esActual={plan.id === planActualId} esRecomendado={plan.id === idRecomendado} />
      ))}
    </div>
  )
}
