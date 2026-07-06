// Anillo circular de progreso con valor central, reutilizable para totales con severidad (mora, alertas, etc).
export default function AnilloProgreso({ valor, etiqueta, porcentaje = 75, color = 'var(--color-error)', colorFondo = 'var(--color-error-container)', tamano = 150, grosor = 12 }) {
  const r = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * r
  const relleno = (Math.min(100, Math.max(0, porcentaje)) / 100) * circunferencia

  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke={colorFondo} strokeWidth={grosor} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia - relleno}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold text-on-background leading-none">{valor}</span>
        <span className="text-[11px] text-on-surface-variant mt-1 text-center px-3 leading-tight">{etiqueta}</span>
      </div>
    </div>
  )
}
