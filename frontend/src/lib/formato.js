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

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Formatea una fecha de CALENDARIO (sin hora significativa: fechaInicio,
// fechaVencimiento, fechaNacimiento, fechaLetra, etc.) — a diferencia de
// formatearFecha, nunca reconstruye un objeto Date desde el string completo.
// `new Date("YYYY-MM-DD")` (o un ISO con hora UTC medianoche) se interpreta
// como UTC; al mostrarse con la hora LOCAL del navegador, la fecha puede
// correrse un día hacia atrás en cualquier timezone detrás de UTC (toda
// América, incluida Colombia UTC-5). Se toman los primeros 10 caracteres
// ("YYYY-MM-DD") del string y se formatean directamente, sin pasar por Date.
// Bug encontrado probando en vivo el wizard de préstamos (2026-07-16): un
// vencimiento calculado correctamente en el backend como 8 de octubre se
// mostraba como "07 de oct" en el navegador. Usar SIEMPRE para fechas de
// negocio sin hora — formatearFecha sigue siendo correcta para timestamps
// reales (createdAt/updatedAt), donde SÍ se quiere convertir a hora local.
export function formatearFechaLocal(fecha) {
  if (!fecha) return '—'
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia} de ${MESES_CORTOS[Number(mes) - 1]} de ${anio}`
}

// Fecha de HOY en formato "YYYY-MM-DD" (el que espera <input type="date">) —
// usa componentes de fecha LOCAL (getFullYear/getMonth/getDate), nunca
// toISOString() (que convierte a UTC): en Colombia (UTC-5), después de las
// 7pm locales toISOString() ya cae en el día siguiente en UTC, mostrando
// "mañana" como fecha por defecto. Mismo tipo de bug ya corregido en
// formatearFechaLocal — companion function para el lado de "generar" en vez
// de "mostrar".
export function fechaHoyISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
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
