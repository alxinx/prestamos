import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../../lib/formato'

export default function ChipEstado({ estado }) {
  const c = COLORES_ESTADO[estado] ?? COLORES_ESTADO.CANCELADO
  return (
    <span
      className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  )
}
