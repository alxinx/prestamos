import TarjetaPanel from './TarjetaPanel'
import TarjetaStat from './TarjetaStat'
import AnilloProgreso from './AnilloProgreso'
import FilaDato from './FilaDato'
import { IcoPersonas, IcoCalendario, IcoMoneda, IcoReloj } from './iconos'
import { formatearPrecio } from '../../lib/formato'

// ── Íconos propios de este panel (sin equivalente compartido) ──────────────

function IcoRuta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  )
}

function IcoObjetivo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IcoMapa() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

// ── Datos ficticios — listo para GET /api/tenant/colaboradores/:id/panel-cobrador ──

const STATS_COBRADOR = [
  {
    id: 'asignados',
    titulo: 'Préstamos asignados',
    subtitulo: 'Total asignados',
    valor: '48',
    imagen3d: '/iconos/prestamos.webp',
    badge: { icono: <IcoPersonas size={14} />, clases: 'bg-primary/10 text-primary' },
    delta: { sube: true, positivo: true, porcentaje: '12.5', texto: 'vs ayer' },
    href: '#',
  },
  {
    id: 'x-cobrar-hoy',
    titulo: 'Préstamos x cobrar hoy',
    subtitulo: 'Pendientes por cobrar',
    valor: '22',
    imagen3d: '/iconos/calendario.webp',
    badge: { icono: <IcoCalendario />, clases: 'bg-primary/10 text-primary' },
    href: '#',
  },
  {
    id: 'cobrados-hoy',
    titulo: 'Préstamos cobrados hoy',
    subtitulo: 'Cobrados exitosamente',
    valor: '16',
    imagen3d: '/iconos/recaudo.webp',
    badge: { icono: <IcoMoneda />, clases: 'bg-secondary/10 text-secondary' },
    notaInferior: { texto: formatearPrecio(1245800), clase: 'text-secondary' },
    href: '#',
  },
  {
    id: 'en-mora',
    titulo: 'Cobros en mora',
    subtitulo: 'En atraso',
    valor: '6',
    imagen3d: '/iconos/mora.webp',
    badge: { icono: <IcoReloj />, clases: 'bg-error/12 text-error' },
    notaInferior: { texto: formatearPrecio(380000), clase: 'text-error' },
    peligro: true,
    href: '#',
  },
]

const CLASES_AVATAR = ['bg-secondary/15 text-secondary', 'bg-primary/10 text-primary', 'bg-tertiary-container/25 text-on-tertiary-container', 'bg-error-container text-on-error-container']

const CLIENTES_VISITAR = [
  { id: 1, nombre: 'María López', telefono: '300 123 4567', prestamo: 'PRE-1001', monto: 120000, direccion: 'Cra 15 # 45-20', barrio: 'Barrio Centro', estado: 'Pendiente' },
  { id: 2, nombre: 'Juan Pérez', telefono: '310 987 6543', prestamo: 'PRE-1002', monto: 85000, direccion: 'Cll 10 # 23-15', barrio: 'Barrio La Paz', estado: 'Pendiente' },
  { id: 3, nombre: 'Carlos Ramírez', telefono: '321 456 7890', prestamo: 'PRE-1003', monto: 95000, direccion: 'Av. 30 # 12-80', barrio: 'Barrio San José', estado: 'Pendiente' },
  { id: 4, nombre: 'Luis Gómez', telefono: '312 654 3210', prestamo: 'PRE-1004', monto: 110000, direccion: 'Cra 8 # 50-12', barrio: 'Barrio El Prado', estado: 'Pendiente' },
  { id: 5, nombre: 'Ana Torres', telefono: '300 555 6677', prestamo: 'PRE-1005', monto: 130000, direccion: 'Cll 25 # 18-45', barrio: 'Barrio Villa Luz', estado: 'Pendiente' },
]

const DESEMPENO = { porcentaje: 97, totalIntereses: 245800, totalCapital: 1000000 }

function iniciales(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

// Panel de indicadores para colaboradores con rol COBRADOR — datos ficticios por
// ahora, ya estructurado para conectarse a un endpoint real de préstamos/cobros.
export default function PanelCobrador() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS_COBRADOR.map(stat => (
          <TarjetaStat key={stat.id} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TarjetaPanel
          icono={<IcoRuta />}
          iconoClases="bg-primary/10 text-primary"
          titulo="Clientes a visitar hoy"
          subtitulo="Planifica tu ruta y gestiona tus cobros"
          accion={
            <a href="#" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant text-on-background text-[12px] font-semibold hover:bg-surface-default transition-colors shrink-0 no-underline">
              <IcoMapa /> Ver ruta en mapa
            </a>
          }
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[560px] text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                  <th className="font-semibold px-1 pb-2">Cliente</th>
                  <th className="font-semibold px-1 pb-2">Préstamo</th>
                  <th className="font-semibold px-1 pb-2">Monto a cobrar</th>
                  <th className="font-semibold px-1 pb-2">Dirección</th>
                  <th className="font-semibold px-1 pb-2">Estado</th>
                  <th className="px-1 pb-2" />
                </tr>
              </thead>
              <tbody>
                {CLIENTES_VISITAR.map((c, i) => (
                  <tr key={c.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                    <td className="px-1 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${CLASES_AVATAR[i % CLASES_AVATAR.length]}`}>
                          {iniciales(c.nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-on-background font-semibold truncate m-0">{c.nombre}</p>
                          <p className="text-on-surface-variant text-[12px] truncate m-0">{c.telefono}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-2.5 text-on-surface-variant whitespace-nowrap">{c.prestamo}</td>
                    <td className="px-1 py-2.5 text-on-background font-semibold whitespace-nowrap">{formatearPrecio(c.monto)}</td>
                    <td className="px-1 py-2.5 text-on-surface-variant">
                      <p className="m-0 truncate">{c.direccion}</p>
                      <p className="m-0 truncate text-[12px]">{c.barrio}</p>
                    </td>
                    <td className="px-1 py-2.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-container/20 text-on-tertiary-container whitespace-nowrap">
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-1 py-2.5 text-on-surface-variant">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <a href="#" className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-outline-variant/40 text-[13px] text-on-surface-variant hover:text-on-background transition-colors no-underline">
            Ver todos los clientes ⌄
          </a>
        </TarjetaPanel>

        <TarjetaPanel
          icono={<IcoObjetivo />}
          iconoClases="bg-secondary/10 text-secondary"
          titulo="Desempeño del día"
          subtitulo="Tu rendimiento en cobros"
        >
          <div className="flex flex-col items-center text-center mb-2">
            <AnilloProgreso
              valor={`${DESEMPENO.porcentaje}%`}
              etiqueta="de los cobros asignados están al día"
              porcentaje={DESEMPENO.porcentaje}
              color="var(--color-secondary)"
              colorFondo="var(--color-secondary-container)"
              tamano={140}
              grosor={11}
            />
            <p className="text-[13px] text-on-surface-variant mt-3">Excelente trabajo, sigue así ⭐</p>
          </div>

          <FilaDato
            icono={<IcoMoneda />}
            iconoClases="bg-secondary/10 text-secondary"
            etiqueta="Total recaudado en intereses"
            valor={formatearPrecio(DESEMPENO.totalIntereses)}
            valorClases="text-secondary"
          />
          <FilaDato
            icono={<IcoObjetivo />}
            iconoClases="bg-on-tertiary-container/12 text-on-tertiary-container"
            etiqueta="Total recaudado en capital"
            valor={formatearPrecio(DESEMPENO.totalCapital)}
            valorClases="text-on-tertiary-container"
          />

          <a href="#" className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/40 text-[13px] text-on-surface-variant hover:text-on-background transition-colors no-underline">
            Ver reporte detallado <span>→</span>
          </a>
        </TarjetaPanel>
      </div>
    </div>
  )
}
