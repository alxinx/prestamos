// Chip de estado DRY — pill-shape con colores suaves del sistema de diseño.
const ESTILOS = {
  ACTIVO:     'bg-secondary-container/25 text-on-secondary-container',
  INACTIVO:   'bg-error-container text-on-error-container',
  SUSPENDIDO: 'bg-error-container text-on-error-container',
  RETIRADO:   'bg-outline-variant/30 text-on-surface-variant',
}

const ETIQUETAS = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
  RETIRADO: 'Retirado',
}

export default function ChipEstado({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${ESTILOS[estado] || ESTILOS.RETIRADO}`}>
      {ETIQUETAS[estado] || estado}
    </span>
  )
}
