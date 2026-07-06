import DashboardTenant from '../../layouts/DashboardTenant'

export default function PlaceholderSeccion({ titulo }) {
  return (
    <DashboardTenant>
      <div className="px-7 pt-10 pb-12 min-h-full">
        <h1 className="text-2xl font-bold text-on-background mb-2">{titulo}</h1>
        <p className="text-on-surface-variant text-sm">Módulo en construcción.</p>
      </div>
    </DashboardTenant>
  )
}
