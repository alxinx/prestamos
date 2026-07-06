import { useId } from 'react'

// Medidor semicircular de progreso (0-100%), con degradado y volumen. Reutilizable para cualquier métrica vs meta.
export default function MedidorSemicircular({ porcentaje = 0, etiqueta, colorInicio = 'var(--color-secondary)', colorFin = 'var(--color-secondary-container)', grosor = 20 }) {
  const idGradiente = useId()
  const pct = Math.min(1, Math.max(0, porcentaje / 100))

  const R = 80
  const cx = 100
  const cy = 95
  const margen = grosor / 2 + 4

  const theta = (1 - pct) * Math.PI
  const eX = cx + R * Math.cos(theta)
  const eY = cy - R * Math.sin(theta)

  return (
    <div className="relative shrink-0" style={{ width: 220, height: 130 }}>
      <svg viewBox={`${cx - R - margen} ${cy - R - margen} ${(R + margen) * 2} ${R + margen + 8}`} className="w-full h-full block">
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colorInicio} />
            <stop offset="100%" stopColor={colorFin} />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="var(--color-outline-variant)"
          strokeOpacity="0.4"
          strokeWidth={grosor}
          strokeLinecap="round"
        />
        {pct > 0.01 && (
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${eX} ${eY}`}
            fill="none"
            stroke={`url(#${idGradiente})`}
            strokeWidth={grosor}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-[32px] sm:text-[36px] font-bold text-on-background leading-none">
          {porcentaje}%
        </span>
        {etiqueta && <span className="text-[13px] text-on-surface-variant mt-1.5">{etiqueta}</span>}
      </div>
    </div>
  )
}
