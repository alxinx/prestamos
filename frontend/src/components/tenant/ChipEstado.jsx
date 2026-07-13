// Chip de estado DRY — pill-shape con colores suaves del sistema de diseño.
// ACTIVA/INACTIVA (femenino) son los valores del enum EstadoCaja (Prisma).
const ESTILOS = {
  ACTIVO:     'bg-secondary-container/25 text-on-secondary-container',
  ACTIVA:     'bg-secondary-container/25 text-on-secondary-container',
  AL_DIA:     'bg-secondary-container/25 text-on-secondary-container',
  INACTIVO:   'bg-error-container text-on-error-container',
  INACTIVA:   'bg-error-container text-on-error-container',
  SUSPENDIDO: 'bg-error-container text-on-error-container',
  EN_MORA:    'bg-error-container text-on-error-container',
  // Ámbar de "período de gracia" ya usado en components/ui/ChipEstado.jsx (master-admin)
  // para el mismo matiz de advertencia — no hay token oficial de CLAUDE.md para esto,
  // se reutiliza el mismo hex en vez de inventar uno nuevo.
  POR_FINALIZAR: 'bg-[#FBBF24]/15 text-[#FBBF24]',
  RETIRADO:   'bg-outline-variant/30 text-on-surface-variant',
}

const ETIQUETAS = {
  ACTIVO: 'Activo',
  ACTIVA: 'Activo',
  AL_DIA: 'Al día',
  INACTIVO: 'Inactivo',
  // INACTIVA es el valor de EstadoCaja (Prisma) — "Suspendido" es más preciso que
  // "Inactivo" para un capital: distinto de INACTIVO (Empleado), que sí dice "Inactivo".
  INACTIVA: 'Suspendido',
  SUSPENDIDO: 'Suspendido',
  EN_MORA: 'En mora',
  POR_FINALIZAR: 'Por finalizar',
  RETIRADO: 'Retirado',
}

export default function ChipEstado({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${ESTILOS[estado] || ESTILOS.RETIRADO}`}>
      {ETIQUETAS[estado] || estado}
    </span>
  )
}
