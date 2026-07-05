import DashboardTenant from '../../layouts/DashboardTenant'

export default function Dashboard() {
  return (
    <DashboardTenant>
      <div className="px-7 pt-10 pb-12 min-h-full">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: '#56fbab' }}>
            Bienvenido
          </p>
          <h1 className="text-3xl font-bold text-slate-50 mb-3" style={{ letterSpacing: '-0.01em' }}>
            Panel de Control
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Tu espacio de gestión de préstamos y cobranzas. El dashboard con métricas y
            resumen de cartera estará disponible próximamente.
          </p>

          <div
            className="rounded-2xl p-6 border"
            style={{ background: 'rgba(86,251,171,0.05)', borderColor: 'rgba(86,251,171,0.12)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#56fbab' }} />
              <span className="text-sm font-semibold" style={{ color: '#56fbab' }}>En construcción</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed m-0">
              Estamos construyendo el dashboard de métricas. Por ahora puedes navegar a
              cualquier módulo usando el menú lateral.
            </p>
          </div>
        </div>
      </div>
    </DashboardTenant>
  )
}
