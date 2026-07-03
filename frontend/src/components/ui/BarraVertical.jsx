/**
 * Termómetro / barra de progreso vertical.
 * Props:
 *   pct      – porcentaje de llenado (0–1)
 *   color    – color del relleno (default verde admin)
 *   altura   – altura total en px (default 80)
 *   ancho    – ancho en px (default 22)
 */
export default function BarraVertical({ pct = 0, color = '#00C982', altura = 80, ancho = 22 }) {
  const fill = Math.min(1, Math.max(0, pct))
  const fillColor = fill > 0.85 ? '#EF4444' : fill > 0.65 ? '#FBBF24' : color

  return (
    <div
      className="relative overflow-hidden shrink-0"
      style={{ width: ancho, height: altura, background: 'rgba(255,255,255,0.06)', borderRadius: ancho / 2 }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 transition-[height] duration-[0.9s] ease-[cubic-bezier(0.34,1.2,0.64,1)]"
        style={{ height: `${fill * 100}%`, background: fillColor, borderRadius: ancho / 2 }}
      />
    </div>
  )
}
