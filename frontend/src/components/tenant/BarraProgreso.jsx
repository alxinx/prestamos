// Barra de progreso horizontal — uso de un recurso vs el límite del plan.
export default function BarraProgreso({ usados, limite, alto = 20 }) {
  const porcentaje = limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 0
  const critico = porcentaje >= 90

  const gradiente = critico
    ? 'linear-gradient(90deg, var(--color-error) 0%, var(--color-error-container) 100%)'
    : 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-secondary-container) 100%)'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-on-surface-variant">
          {usados} de {limite} del plan
        </span>
        <span className={`text-base font-bold ${critico ? 'text-error' : 'text-secondary'}`}>
          {porcentaje}%
        </span>
      </div>
      <div
        className="w-full rounded-full bg-outline-variant/40 overflow-hidden"
        style={{ height: alto, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)' }}
      >
        <div
          className="relative h-full rounded-full transition-[width] duration-500 ease-out overflow-hidden"
          style={{ width: `${porcentaje}%`, background: gradiente }}
        >
          {/* Brillo superior — da sensación de volumen/relieve */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 45%, rgba(0,0,0,0.12) 100%)' }}
          />
        </div>
      </div>
    </div>
  )
}
