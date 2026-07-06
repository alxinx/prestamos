import DashboardTenant from '../../layouts/DashboardTenant'

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

// ── Componente DRY: tarjeta de estadística ───────────────────────────────────

function TarjetaStat({ titulo, subtitulo, valor, imagen3d, badge, delta, href, peligro }) {
  return (
    <div className="relative bg-surface-lowest border border-outline-variant/50 rounded-2xl overflow-hidden flex flex-col min-h-[178px] shadow-card">

      {/* Ilustración 3D — esquina superior derecha */}
      <img
        src={imagen3d}
        alt=""
        className="absolute top-3 right-3 w-[82px] h-[82px] sm:w-[96px] sm:h-[96px] object-contain pointer-events-none select-none"
      />

      {/* Contenido principal */}
      <div className="flex-1 p-5 pr-[98px] sm:pr-[112px]">

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

// ── Dashboard principal ───────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <DashboardTenant>
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

        {/* Encabezado */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">
            Panel
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Grid de stats — 1 col mobile / 2 cols tablet / 4 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map(stat => (
            <TarjetaStat key={stat.id} {...stat} />
          ))}
        </div>

      </div>
    </DashboardTenant>
  )
}
