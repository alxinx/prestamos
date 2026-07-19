// Barra de progreso horizontal — uso de un recurso vs el límite del plan.
// El porcentaje se muestra flotando sobre la barra (no en el encabezado) para
// que nunca choque con la ilustración 3D de la tarjeta que la contiene.
//
// `horizontal` (opcional, default false): pone la etiqueta "X de Y del plan" a
// la izquierda de la barra en vez de encima — usada por AvisoLimitePlan.jsx.
// El uso por defecto (TarjetaStat en Dashboard.jsx) no cambia.
export default function BarraProgreso({ usados, limite, alto = 22, horizontal = false }) {
  const porcentaje = limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 0
  const critico = porcentaje >= 90

  const gradiente = critico
    ? 'linear-gradient(90deg, var(--color-error) 0%, var(--color-error-container) 100%)'
    : 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-secondary-container) 100%)'

  const barra = (
    <div
      className="relative w-full rounded-full bg-outline-variant/40 overflow-hidden"
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

      {/* Porcentaje — pill navy sobre la barra: contrasta contra el riel gris y el relleno verde */}
      <span
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] font-bold leading-none px-2 py-1 rounded-full ${
          critico ? 'bg-error text-white' : 'bg-primary text-on-primary'
        }`}
        style={{ boxShadow: '0 1px 4px rgba(0,20,48,0.3)' }}
      >
        {porcentaje}%
      </span>
    </div>
  )

  const etiqueta = (
    <span className="text-sm text-on-surface-variant whitespace-nowrap shrink-0">
      {usados} de {limite} del plan
    </span>
  )

  if (horizontal) {
    return (
      <div className="flex items-center gap-4">
        {etiqueta}
        <div className="flex-1">{barra}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2">{etiqueta}</div>
      {barra}
    </div>
  )
}
