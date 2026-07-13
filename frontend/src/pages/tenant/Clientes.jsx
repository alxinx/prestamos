import { useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import ChipEstado from '../../components/tenant/ChipEstado'
import Paginador from '../../components/tenant/Paginador'
import BotonAccion from '../../components/tenant/BotonAccion'
import { IcoMas, IcoPersonas, IcoCheck, IcoReloj, IcoChevronAbajo, IcoOpciones, IcoEstrella } from '../../components/tenant/iconos'
import { formatearPrecio } from '../../lib/formato'
import { inicialesDe, claseAvatar } from '../../lib/avatar'

// ── Íconos propios de esta página (sin equivalente compartido) ─────────────

function IcoBuscar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IcoFiltro() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

// Badge pequeño de la tarjeta "Clientes en mora" — mismo triángulo de alerta que
// usan Dashboard.jsx y CapitalPanel.jsx en sus propios badges/zonas de riesgo,
// redefinido aquí en vez de compartido (es un ícono de 14px, de un solo uso por página).
function IcoAlerta({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  )
}

// ── Datos ficticios — se conectarán a GET /api/tenant/clientes cuando exista el
// backend del módulo (por ahora solo hay schema.prisma, sin servicio/rutas) ────

const STATS = [
  {
    id: 'total',
    titulo: 'Total clientes',
    subtitulo: 'Clientes registrados',
    valor: '128',
    imagen3d: '/iconos/users.webp',
    badge: { icono: <IcoPersonas size={14} />, clases: 'bg-on-tertiary-container/12 text-on-tertiary-container' },
    delta: { sube: true, positivo: true, porcentaje: '12.5', texto: 'vs mes anterior' },
    href: '#',
  },
  {
    id: 'al-dia',
    titulo: '% de clientes al día',
    subtitulo: 'Clientes con pagos al día',
    valor: '81.4%',
    imagen3d: '/iconos/escudo.webp',
    badge: { icono: <IcoCheck size={14} />, clases: 'bg-secondary/10 text-secondary' },
    delta: { sube: true, positivo: true, porcentaje: '8.3', texto: 'vs mes anterior' },
    href: '#',
  },
  {
    id: 'por-finalizar',
    titulo: 'Clientes por finalizar',
    subtitulo: 'Con 1 a 3 cuotas pendientes',
    valor: '23',
    imagen3d: '/iconos/time.webp',
    // Mismo ámbar reutilizado en ChipEstado para POR_FINALIZAR — ver esa nota.
    badge: { icono: <IcoReloj size={14} />, clases: 'bg-[#FBBF24]/15 text-[#FBBF24]' },
    delta: { sube: true, positivo: true, porcentaje: '5.6', texto: 'vs mes anterior' },
    href: '#',
  },
  {
    id: 'mora',
    titulo: 'Clientes en mora',
    subtitulo: 'Con pagos vencidos',
    valor: '18',
    imagen3d: '/iconos/mora.webp',
    badge: { icono: <IcoAlerta />, clases: 'bg-error/12 text-error' },
    delta: { sube: true, positivo: false, porcentaje: '20.0', texto: 'vs mes anterior' },
    href: '#',
    peligro: true,
  },
]

const CLIENTES = [
  { id: 1, nombre: 'María López',    telefono: '300 123 4567', cedula: '1.234.567.890', prestamos: 2, valorPrestamo: 20000000, valorAdeudado: 5200000, calificacion: 4, cuotasFaltantes: 4, estado: 'AL_DIA' },
  { id: 2, nombre: 'Juan Pérez',     telefono: '310 987 6543', cedula: '1.098.765.432', prestamos: 1, valorPrestamo: 10000000, valorAdeudado: 0,       calificacion: 4, cuotasFaltantes: 0, estado: 'AL_DIA' },
  { id: 3, nombre: 'Carlos Ramírez', telefono: '321 456 7890', cedula: '1.112.233.445', prestamos: 3, valorPrestamo: 30000000, valorAdeudado: 3450000, calificacion: 4, cuotasFaltantes: 2, estado: 'POR_FINALIZAR' },
  { id: 4, nombre: 'Luis Gómez',     telefono: '312 654 3210', cedula: '1.223.344.556', prestamos: 1, valorPrestamo: 8000000,  valorAdeudado: 1200000, calificacion: 3, cuotasFaltantes: 1, estado: 'POR_FINALIZAR' },
  { id: 5, nombre: 'Ana Torres',     telefono: '300 555 6677', cedula: '1.334.455.667', prestamos: 2, valorPrestamo: 15000000, valorAdeudado: 2800000, calificacion: 3, cuotasFaltantes: 3, estado: 'EN_MORA' },
  { id: 6, nombre: 'Pedro Sánchez',  telefono: '311 778 8899', cedula: '1.445.566.778', prestamos: 1, valorPrestamo: 7000000,  valorAdeudado: 3500000, calificacion: 3, cuotasFaltantes: 4, estado: 'EN_MORA' },
]

const TOTAL_CLIENTES = 128
const POR_PAGINA = 6

function Estrellas({ calificacion }) {
  return (
    <div className="flex items-center gap-0.5 text-[#FBBF24]">
      {Array.from({ length: 5 }, (_, i) => (
        <IcoEstrella key={i} lleno={i < calificacion} />
      ))}
    </div>
  )
}

export default function Clientes() {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(TOTAL_CLIENTES / POR_PAGINA))
  const inicioRango = (pagina - 1) * POR_PAGINA + 1
  const finRango = Math.min(pagina * POR_PAGINA, TOTAL_CLIENTES)

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">Módulo</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Clientes</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">Gestiona y consulta la información de todos tus clientes.</p>
        </div>
        <BotonAccion href="/clientes/nuevo" icono={<IcoMas />}>Crear cliente</BotonAccion>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {STATS.map(stat => <TarjetaStat key={stat.id} {...stat} />)}
      </div>

      {/* Listado */}
      <TarjetaPanel
        icono={<IcoPersonas size={18} />}
        iconoClases="bg-primary/10 text-primary"
        titulo="Listado de clientes"
        subtitulo="Consulta y administra la información de tus clientes."
        accion={
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                <IcoBuscar />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-9 pr-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors w-[160px] sm:w-[200px]"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant text-[13px] text-on-surface-variant bg-surface-lowest hover:bg-surface-default transition-colors shrink-0"
            >
              <IcoFiltro /> Filtros
            </button>
            <div className="relative shrink-0">
              <select
                defaultValue=""
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-outline-variant text-[13px] text-on-background bg-surface-lowest outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Estado: Todos</option>
                <option value="AL_DIA">Al día</option>
                <option value="POR_FINALIZAR">Por finalizar</option>
                <option value="EN_MORA">En mora</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                <IcoChevronAbajo />
              </span>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[880px] text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                <th className="font-semibold px-1 pb-2">Cliente</th>
                <th className="font-semibold px-1 pb-2">Identificación</th>
                <th className="font-semibold px-1 pb-2 text-center">Préstamos</th>
                <th className="font-semibold px-1 pb-2">Valor de préstamo</th>
                <th className="font-semibold px-1 pb-2">Valor adeudado</th>
                <th className="font-semibold px-1 pb-2">Calificación</th>
                <th className="font-semibold px-1 pb-2 text-center">Cuotas faltantes</th>
                <th className="font-semibold px-1 pb-2">Estado</th>
                <th className="px-1 pb-2" />
              </tr>
            </thead>
            <tbody>
              {CLIENTES.map((c, i) => (
                <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                  <td className="px-1 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                        {inicialesDe(c.nombre)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-on-background font-semibold truncate m-0">{c.nombre}</p>
                        <p className="text-on-surface-variant text-[12px] truncate m-0">{c.telefono}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-on-background whitespace-nowrap">CC {c.cedula}</td>
                  <td className="px-1 py-3 text-on-background font-semibold text-center">{c.prestamos}</td>
                  <td className="px-1 py-3 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.valorPrestamo)}</td>
                  <td className={`px-1 py-3 font-semibold whitespace-nowrap ${c.valorAdeudado > 0 ? 'text-error' : 'text-secondary'}`}>
                    {formatearPrecio(c.valorAdeudado)}
                  </td>
                  <td className="px-1 py-3"><Estrellas calificacion={c.calificacion} /></td>
                  <td className="px-1 py-3 text-on-background font-semibold text-center">{c.cuotasFaltantes}</td>
                  <td className="px-1 py-3"><ChipEstado estado={c.estado} /></td>
                  <td className="px-1 py-3 text-right">
                    <button
                      type="button"
                      aria-label="Más acciones"
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-default transition-colors"
                    >
                      <IcoOpciones />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/40 flex-wrap gap-3">
          <p className="text-[12px] text-on-surface-variant m-0">
            Mostrando {inicioRango} a {finRango} de {TOTAL_CLIENTES} clientes
          </p>
          <Paginador pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </div>
      </TarjetaPanel>
    </div>
  )
}
