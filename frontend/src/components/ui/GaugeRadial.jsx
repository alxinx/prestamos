/**
 * Medidor semicircular estilo velocímetro.
 * Props:
 *   valor    – valor actual
 *   maximo   – valor máximo
 *   color    – color del arco de progreso (default verde admin)
 *   grosor   – strokeWidth (default 10)
 */
export default function GaugeRadial({ valor = 0, maximo = 100, color = '#56fbab', grosor = 10 }) {
  const pct = maximo > 0 ? Math.min(1, Math.max(0, valor / maximo)) : 0
  const R = 52
  const cx = 70
  const cy = 65

  const theta = (1 - pct) * Math.PI
  const eX = cx + R * Math.cos(theta)
  const eY = cy - R * Math.sin(theta)
  const nX = cx + (R - 12) * Math.cos(theta)
  const nY = cy - (R - 12) * Math.sin(theta)

  const margen = grosor / 2 + 2
  const vX = cx - R - margen
  const vY = cy - R - margen
  const vW = (R + margen) * 2
  const vH = R + margen + 8

  return (
    <svg
      viewBox={`${vX} ${vY} ${vW} ${vH}`}
      className="w-full max-w-[160px] block mx-auto"
    >
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={grosor}
        strokeLinecap="round"
      />
      {pct > 0.01 && (
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${eX} ${eY}`}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
        />
      )}
      <line
        x1={cx} y1={cy}
        x2={nX} y2={nY}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx={cx} cy={cy} r="4" fill="white" opacity="0.9" />
    </svg>
  )
}
