// Chip de estado DRY — pill-shape con colores suaves del sistema de diseño.
// ACTIVA/INACTIVA (femenino) son los valores del enum EstadoCaja (Prisma).
const ESTILOS = {
  ACTIVO:     'bg-secondary-container/25 text-on-secondary-container',
  ACTIVA:     'bg-secondary-container/25 text-on-secondary-container',
  INACTIVO:   'bg-error-container text-on-error-container',
  INACTIVA:   'bg-error-container text-on-error-container',
  SUSPENDIDO: 'bg-error-container text-on-error-container',
  RETIRADO:   'bg-outline-variant/30 text-on-surface-variant',
}

const ETIQUETAS = {
  ACTIVO: 'Activo',
  ACTIVA: 'Activo',
  INACTIVO: 'Inactivo',
  // INACTIVA es el valor de EstadoCaja (Prisma) — "Suspendido" es más preciso que
  // "Inactivo" para un capital: distinto de INACTIVO (Empleado), que sí dice "Inactivo".
  INACTIVA: 'Suspendido',
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
