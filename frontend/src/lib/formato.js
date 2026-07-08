export function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor))
}

// Los límites de plan usan -1 como valor centinela de "ilimitado" (ver schema de Prisma).
export const LIMITE_ILIMITADO = -1

export function formatearLimite(valor) {
  return Number(valor) === LIMITE_ILIMITADO ? '∞' : new Intl.NumberFormat('es-CO').format(Number(valor))
}

export function esIlimitado(valor) {
  return Number(valor) === LIMITE_ILIMITADO
}

export function formatearFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const COLORES_ESTADO = {
  ACTIVO:         { bg: 'rgba(0,201,130,0.12)',   color: '#00C982', border: 'rgba(0,201,130,0.25)' },
  INACTIVO:       { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  PERIODO_GRACIA: { bg: 'rgba(251,191,36,0.12)',  color: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  SUSPENDIDO:     { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  CANCELADO:      { bg: 'rgba(100,116,139,0.12)', color: '#64748B', border: 'rgba(100,116,139,0.25)' },
}

export const ETIQUETAS_ESTADO = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  PERIODO_GRACIA: 'Gracia',
  SUSPENDIDO: 'Suspendido',
  CANCELADO: 'Cancelado',
}
