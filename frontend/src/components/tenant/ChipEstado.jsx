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
  // BLOQUEADO/FALLECIDO son valores reales del enum EstadoCliente (Prisma).
  BLOQUEADO:  'bg-error-container text-on-error-container',
  FALLECIDO:  'bg-outline-variant/30 text-on-surface-variant',
  // PAGADO/VENCIDO/CASTIGADO/REFINANCIADO son valores reales del enum
  // EstadoCredito (Prisma) — ACTIVO y EN_MORA ya están arriba, compartidos.
  PAGADO:       'bg-secondary-container/25 text-on-secondary-container',
  VENCIDO:      'bg-error-container text-on-error-container',
  CASTIGADO:    'bg-error-container text-on-error-container',
  REFINANCIADO: 'bg-tertiary-container/25 text-on-tertiary-container',
  // LIQUIDADO/PENDIENTE_LIQUIDAR/ANULADO son valores reales del enum EstadoPago
  // (Prisma). EXTEMPORANEO no es un valor de enum — es una etiqueta sintética
  // que la pestaña "Pagos" del perfil de cliente usa cuando el pago viene de
  // una SolicitudExtemporanea aprobada; reusa el mismo ámbar de POR_FINALIZAR.
  LIQUIDADO:          'bg-secondary-container/25 text-on-secondary-container',
  PENDIENTE_LIQUIDAR: 'bg-[#FBBF24]/15 text-[#FBBF24]',
  ANULADO:            'bg-error-container text-on-error-container',
  EXTEMPORANEO:       'bg-[#FBBF24]/15 text-[#FBBF24]',
  // CUOTA_PENDIENTE no es un valor de enum — es una etiqueta sintética de la
  // pestaña "Plan de pagos" del detalle de préstamo, para una cuota futura
  // que todavía no vence (distinta de PENDIENTE_LIQUIDAR, que es sobre un
  // pago ya recibido esperando revisión — gris neutro, no ámbar, para no
  // confundir ambos significados).
  CUOTA_PENDIENTE:    'bg-outline-variant/30 text-on-surface-variant',
  // SE_COBRA_HOY tampoco es un valor de enum — cuota cuya fecha de cobro es
  // HOY mismo: todavía no es "En mora" (eso arranca recién al día siguiente
  // de vencer, decisión del usuario 2026-07-23), pero ya no es una cuota
  // futura genérica — mismo ámbar que POR_FINALIZAR/EXTEMPORANEO.
  SE_COBRA_HOY:       'bg-[#FBBF24]/15 text-[#FBBF24]',
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
  BLOQUEADO: 'Bloqueado',
  FALLECIDO: 'Fallecido',
  PAGADO: 'Pagado',
  VENCIDO: 'Vencido',
  CASTIGADO: 'Castigado',
  REFINANCIADO: 'Refinanciado',
  LIQUIDADO: 'Liquidado',
  PENDIENTE_LIQUIDAR: 'Pendiente',
  ANULADO: 'Anulado',
  EXTEMPORANEO: 'Extemporáneo',
  CUOTA_PENDIENTE: 'Pendiente',
  SE_COBRA_HOY: 'Se cobra hoy',
}

// `punto` — antepone un punto de color (bg-current, toma el mismo color del
// texto del chip) en vez de solo el texto. Usado en el header del perfil de
// cliente (mockup: "• Activo" debajo del avatar).
export default function ChipEstado({ estado, punto = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${ESTILOS[estado] || ESTILOS.RETIRADO}`}>
      {punto && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {ETIQUETAS[estado] || estado}
    </span>
  )
}
