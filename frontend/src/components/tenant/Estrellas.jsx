import { IcoEstrella } from './iconos'

// Calificación en estrellas DRY (1-5) — usada en el listado de clientes y en
// el modal de detalle del wizard de préstamos.
export default function Estrellas({ calificacion }) {
  if (calificacion == null) return <span className="text-on-surface-variant text-[12px]">—</span>
  return (
    <div className="flex items-center gap-0.5 text-[#FBBF24]">
      {Array.from({ length: 5 }, (_, i) => (
        <IcoEstrella key={i} lleno={i < Math.round(calificacion)} />
      ))}
    </div>
  )
}
