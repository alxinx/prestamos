import BarraProgreso from '../../components/tenant/BarraProgreso'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import FilaDato from '../../components/tenant/FilaDato'
import MedidorSemicircular from '../../components/tenant/MedidorSemicircular'
import GraficoBarras from '../../components/tenant/GraficoBarras'
import AnilloProgreso from '../../components/tenant/AnilloProgreso'
import FilaActividad from '../../components/tenant/FilaActividad'
import FilaVencimiento from '../../components/tenant/FilaVencimiento'
import BotonAccion from '../../components/tenant/BotonAccion'
import { IcoMas } from '../../components/tenant/iconos'
import { formatearPrecio } from '../../lib/formato'

// ── Iconos para los badges pequeños ─────────────────────────────────────────

function IcoTendencia() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function IcoCalendario() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IcoMoneda() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IcoReloj() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IcoPulso() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 12 7 12 9 6 13 18 15 12 22 12" />
    </svg>
  )
}

function IcoAlerta() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" /><path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  )
}

// ── Componente DRY: tarjeta de estadística ───────────────────────────────────

function TarjetaStat({ titulo, subtitulo, valor, imagen3d, badge, delta, href, peligro, planUso }) {
  return (
    <div className="relative bg-surface-lowest border border-outline-variant/50 rounded-2xl overflow-hidden flex flex-col min-h-[178px] shadow-card">

      {/* Ilustración 3D — derecha, centrada verticalmente */}
      <img
        src={imagen3d}
        alt=""
        className="absolute top-1/2 -translate-y-1/2 right-3 w-[107px] h-[107px] sm:w-[125px] sm:h-[125px] object-contain pointer-events-none select-none"
      />

      {/* Contenido principal */}
      <div className="flex-1 p-5 pr-[123px] sm:pr-[141px]">

        {/* Badge + título */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${badge.clases}`}>
            {badge.icono}
          </span>
          <span className="text-on-surface-variant text-[13px] font-semibold leading-tight line-clamp-1">
            {titulo}
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant mb-4 pl-[34px]">{subtitulo}</p>

        {/* Valor principal */}
        <p className={`font-bold tracking-tight leading-none mb-2 ${
          peligro
            ? 'text-[38px] sm:text-[44px] text-error animate-[brillo-rojo_2s_ease-in-out_infinite]'
            : 'text-[30px] sm:text-[33px] text-on-background'
        }`}>
          {valor}
        </p>

        {/* Delta */}
        {delta && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[12px] font-bold ${delta.positivo ? 'text-secondary' : 'text-error'}`}>
              {delta.sube ? '↑' : '↓'} {delta.porcentaje}%
            </span>
            <span className="text-[11px] text-on-surface-variant">{delta.texto}</span>
          </div>
        )}
      </div>

      {/* Footer — Ver detalle */}
      {href && (
        <a
          href={href}
          className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/50 text-[12px] text-on-surface-variant hover:text-on-tertiary-container hover:bg-surface-low transition-all duration-150 shrink-0"
        >
          Ver detalle
          <span className="text-sm">→</span>
        </a>
      )}

      {/* Footer — Uso del plan */}
      {planUso && (
        <div className="px-5 py-3 border-t border-outline-variant/50 shrink-0">
          <BarraProgreso usados={planUso.usados} limite={planUso.limite} />
        </div>
      )}
    </div>
  )
}

// ── Datos ficticios (se conectarán a la API en sprint de métricas) ────────────

const STATS = [
  {
    id: 'creditos-activos',
    titulo: 'Créditos activos',
    subtitulo: 'Total actuales',
    valor: '128',
    imagen3d: '/iconos/prestamos.webp',
    badge: { icono: <IcoTendencia />, clases: 'bg-on-tertiary-container/12 text-on-tertiary-container' },
    delta: { sube: true, positivo: true, porcentaje: '18.6', texto: 'vs mes anterior' },
    href: null,
    planUso: { usados: 128, limite: 150 },
  },
  {
    id: 'por-recaudar',
    titulo: 'Por recaudar hoy',
    subtitulo: 'Total pendiente',
    valor: '$142.680',
    imagen3d: '/iconos/calendario.webp',
    badge: { icono: <IcoCalendario />, clases: 'bg-primary/10 text-primary' },
    delta: null,
    href: '/cobros',
  },
  {
    id: 'recaudado-hoy',
    titulo: 'Recaudado hoy',
    subtitulo: 'Total recibido',
    valor: '$67.430',
    imagen3d: '/iconos/recaudo.webp',
    badge: { icono: <IcoMoneda />, clases: 'bg-secondary/10 text-secondary' },
    delta: { sube: true, positivo: true, porcentaje: '47.3', texto: 'vs ayer' },
    href: '/cobros',
  },
  {
    id: 'creditos-mora',
    titulo: 'Créditos en mora',
    subtitulo: 'Total en atraso',
    valor: '23',
    imagen3d: '/iconos/mora.webp',
    badge: { icono: <IcoReloj />, clases: 'bg-error/12 text-error' },
    delta: { sube: true, positivo: false, porcentaje: '32.4', texto: 'vs ayer' },
    href: '/prestamos',
    peligro: true,
  },
]

// ── Recaudo del día — ficticio, listo para GET /api/tenant/dashboard/recaudo-dia ──

const RECAUDO_DIA = {
  metaDiaria: 142680,
  recaudado: 67430,
}
const PORCENTAJE_RECAUDO = Math.round((RECAUDO_DIA.recaudado / RECAUDO_DIA.metaDiaria) * 1000) / 10
const FALTANTE_RECAUDO = RECAUDO_DIA.metaDiaria - RECAUDO_DIA.recaudado

// ── Créditos en mora — ficticio, listo para GET /api/tenant/dashboard/mora ────────

const MORA = {
  total: 23,
  rangos: [
    { etiqueta: '1 - 30 días', valor: 12, claseColor: 'bg-error/25' },
    { etiqueta: '31 - 60 días', valor: 7, claseColor: 'bg-error/50' },
    { etiqueta: '61 - 90 días', valor: 3, claseColor: 'bg-error/70' },
    { etiqueta: '+90 días', valor: 1, claseColor: 'bg-error' },
  ],
}

// ── Actividades recientes — ficticio, listo para GET /api/tenant/dashboard/actividad ──

const ACTIVIDADES_RECIENTES = [
  {
    id: 'act-1',
    titulo: 'Pago recibido',
    subtitulo: 'Cliente: Laura Gutiérrez',
    monto: `+${formatearPrecio(850)}`,
    montoClases: 'text-secondary',
    tiempo: 'Hace 25 min',
    icono: <IcoMoneda />,
    iconoClases: 'bg-secondary/10 text-secondary',
  },
  {
    id: 'act-2',
    titulo: 'Crédito vencido',
    subtitulo: 'Cliente: Distribuciones MS',
    monto: formatearPrecio(1250),
    montoClases: 'text-error',
    tiempo: 'Hace 1 hora',
    icono: <IcoAlerta />,
    iconoClases: 'bg-error/12 text-error',
  },
]

// ── Próximos vencimientos — ficticio, listo para GET /api/tenant/dashboard/vencimientos ──

const PROXIMOS_VENCIMIENTOS = [
  { id: 'venc-1', nombre: 'Juan Pérez', monto: formatearPrecio(2500), fecha: 'Hoy' },
  { id: 'venc-2', nombre: 'Comercial del Norte SAS', monto: formatearPrecio(1850), fecha: 'Hoy' },
  { id: 'venc-3', nombre: 'Distribuciones MS', monto: formatearPrecio(1250), fecha: 'Mañana' },
]

// ── Dashboard principal ───────────────────────────────────────────────────────

export default function Dashboard() {
  return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

        {/* Encabezado */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">
              Panel
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">
              Dashboard
            </h1>
          </div>

          <BotonAccion href="/prestamos/nuevo" icono={<IcoMas />}>
            Crear nuevo préstamo
          </BotonAccion>
        </div>

        {/* Grid de stats — 1 col mobile / 2 cols tablet / 4 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map(stat => (
            <TarjetaStat key={stat.id} {...stat} />
          ))}
        </div>

        {/* Paneles — Recaudo del día / Créditos en mora */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

          <TarjetaPanel
            icono={<IcoPulso />}
            iconoClases="bg-secondary/10 text-secondary"
            titulo="Recaudo del día"
            subtitulo="Progreso vs meta diaria"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <MedidorSemicircular
                porcentaje={PORCENTAJE_RECAUDO}
                etiqueta={`${formatearPrecio(RECAUDO_DIA.recaudado)} / ${formatearPrecio(RECAUDO_DIA.metaDiaria)}`}
              />
              <div className="w-full flex-1">
                <FilaDato
                  icono={<IcoCalendario />}
                  iconoClases="bg-primary/10 text-primary"
                  etiqueta="Meta diaria"
                  valor={formatearPrecio(RECAUDO_DIA.metaDiaria)}
                />
                <FilaDato
                  icono={<IcoMoneda />}
                  iconoClases="bg-secondary/10 text-secondary"
                  etiqueta="Recaudado"
                  valor={formatearPrecio(RECAUDO_DIA.recaudado)}
                  valorClases="text-secondary"
                />
                <FilaDato
                  icono={<IcoAlerta />}
                  iconoClases="bg-error/12 text-error"
                  etiqueta="Faltante"
                  valor={formatearPrecio(FALTANTE_RECAUDO)}
                  valorClases="text-error"
                />
              </div>
            </div>
          </TarjetaPanel>

          <TarjetaPanel
            icono={<IcoCalendario />}
            iconoClases="bg-error/12 text-error"
            titulo="Créditos en mora"
            subtitulo="Distribución por rango de atraso"
            accion={
              <a
                href="/prestamos?filtro=mora"
                className="inline-flex items-center px-4 py-2 rounded-full bg-tertiary-container/10 text-on-tertiary-container text-[12px] font-semibold hover:bg-tertiary-container/20 transition-colors shrink-0"
              >
                Ver reporte
              </a>
            }
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <GraficoBarras datos={MORA.rangos} />
              <AnilloProgreso
                valor={MORA.total}
                etiqueta="Total en mora"
                porcentaje={78}
              />
            </div>
          </TarjetaPanel>

        </div>

        {/* Paneles — Actividades recientes / Próximos vencimientos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

          <TarjetaPanel
            icono={<IcoPulso />}
            iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container"
            titulo="Actividades recientes"
            subtitulo="Últimos movimientos"
          >
            <div>
              {ACTIVIDADES_RECIENTES.map(act => (
                <FilaActividad key={act.id} {...act} />
              ))}
            </div>
          </TarjetaPanel>

          <TarjetaPanel
            icono={<IcoCalendario />}
            iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container"
            titulo="Próximos vencimientos"
            subtitulo="Créditos por cobrar"
            accion={
              <a
                href="/cobros"
                className="inline-flex items-center px-4 py-2 rounded-full bg-tertiary-container/10 text-on-tertiary-container text-[12px] font-semibold hover:bg-tertiary-container/20 transition-colors shrink-0"
              >
                Ver todos
              </a>
            }
          >
            <div>
              {PROXIMOS_VENCIMIENTOS.map(venc => (
                <FilaVencimiento key={venc.id} {...venc} />
              ))}
            </div>
          </TarjetaPanel>

        </div>

      </div>
  )
}
