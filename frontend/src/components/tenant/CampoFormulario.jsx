// Fila de formulario DRY: etiqueta + control + mensaje de error.
// `obtenerClaseInput` centraliza las clases de cualquier input/select/textarea del tenant,
// incluyendo variantes con ícono izquierdo/derecho y estado de error — siempre calculadas
// como un único valor por propiedad (nunca dos utilidades de padding/borde en conflicto).
export function obtenerClaseInput({ error = false, iconoIzquierda = false, iconoDerecha = false } = {}) {
  const pl = iconoIzquierda ? 'pl-10' : 'pl-3.5'
  const pr = iconoDerecha ? 'pr-10' : 'pr-3.5'
  const plFoco = iconoIzquierda ? 'focus:pl-[39px]' : 'focus:pl-[13px]'
  const prFoco = iconoDerecha ? 'focus:pr-[39px]' : 'focus:pr-[13px]'
  const color = error
    ? 'border-error bg-error-container/10 focus:border-error'
    : 'border-outline-variant bg-surface-lowest focus:border-primary'

  return [
    'w-full', pl, pr, 'py-2.5', plFoco, prFoco, 'focus:py-[9px]',
    'rounded-lg border', color, 'text-[14px] text-on-background outline-none transition-colors',
    'placeholder:text-on-surface-variant/60 focus:border-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ')
}

// Clase por defecto (sin ícono, sin error) — se mantiene para los inputs/selects existentes.
export const claseInput = obtenerClaseInput()

export default function CampoFormulario({ etiqueta, error, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-on-surface-variant mb-1.5">
        {etiqueta}
      </label>
      {children}
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}
    </div>
  )
}
