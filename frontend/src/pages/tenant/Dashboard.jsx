import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import FilaDato from '../../components/tenant/FilaDato'
import MedidorSemicircular from '../../components/tenant/MedidorSemicircular'
import GraficoBarras from '../../components/tenant/GraficoBarras'
import AnilloProgreso from '../../components/tenant/AnilloProgreso'
import FilaActividad from '../../components/tenant/FilaActividad'
import FilaVencimiento from '../../components/tenant/FilaVencimiento'
import BotonAccion from '../../components/tenant/BotonAccion'
import ConPermiso from '../../components/tenant/ConPermiso'
import { IcoMas, IcoCalendario, IcoMoneda, IcoReloj, IcoAlerta, IcoTendencia } from '../../components/tenant/iconos'
import { formatearPrecio } from '../../lib/formato'
import { apiFetch } from '../../lib/api'

// ── Iconos para los badges pequeños ─────────────────────────────────────────
// IcoTendencia/IcoAlerta viven en components/iconos.jsx (compartidos con
// Clientes.jsx y Prestamos.jsx). IcoPulso sigue local: de un solo uso acá.

function IcoPulso() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 12 7 12 9 6 13 18 15 12 22 12" />
    </svg>
  )
}

// ── Datos ficticios (se conectarán a la API en sprint de métricas) ────────────
// "Créditos activos" ya no vive acá — se arma en el componente con datos reales
// de GET /api/tenant/dashboard/creditos-activos (ver STATS_FICTICIOS más abajo).

const STATS_FICTICIOS = [
  {
    id: 'por-recaudar',
    titulo: 'Por recaudar hoy',
    subtitulo: 'Total pendiente',
    valor: '$142.680',
    imagen3d: '/iconos/calendario.webp',
    badge: { icono: <IcoCalendario />, clases: 'bg-primary/10 text-primary' },
    delta: null,
    href: '/prestamos',
  },
  {
    id: 'recaudado-hoy',
    titulo: 'Recaudado hoy',
    subtitulo: 'Total recibido',
    valor: '$67.430',
    imagen3d: '/iconos/recaudo.webp',
    badge: { icono: <IcoMoneda />, clases: 'bg-secondary/10 text-secondary' },
    delta: { sube: true, positivo: true, porcentaje: '47.3', texto: 'vs ayer' },
    href: '/prestamos',
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
  // { usados, limite } de créditos activos vs. lo permitido por el plan rentado —
  // null mientras carga o si el empleado no tiene permiso para verlo (403).
  const [creditosActivos, setCreditosActivos] = useState(null)
  const [cargandoCreditos, setCargandoCreditos] = useState(true)

  useEffect(() => {
    async function cargarCreditosActivos() {
      const { ok, datos } = await apiFetch('/api/tenant/dashboard/creditos-activos')
      if (ok) setCreditosActivos(datos)
      setCargandoCreditos(false)
    }
    cargarCreditosActivos()
  }, [])

  const stats = [
    {
      id: 'creditos-activos',
      titulo: 'Créditos activos',
      subtitulo: 'Total actuales',
      valor: cargandoCreditos ? '—' : String(creditosActivos?.usados ?? 0),
      imagen3d: '/iconos/prestamos.webp',
      badge: { icono: <IcoTendencia />, clases: 'bg-on-tertiary-container/12 text-on-tertiary-container' },
      delta: null,
      href: null,
      planUso: creditosActivos ? { usados: creditosActivos.usados, limite: creditosActivos.limite } : null,
    },
    ...STATS_FICTICIOS,
  ]

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

          <ConPermiso permiso="creditos.crear" compacto>
            <BotonAccion href="/prestamos/nuevo" icono={<IcoMas />}>
              Crear nuevo préstamo
            </BotonAccion>
          </ConPermiso>
        </div>

        {/* Grid de stats — 1 col mobile / 2 cols tablet / 4 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(stat => (
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
                href="/prestamos"
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
