// Fila de formulario DRY: etiqueta + control + mensaje de error.
// `claseInput` se exporta para que inputs/selects en cualquier formulario tenant luzcan igual.
export const claseInput =
  'w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-lowest text-[14px] text-on-background ' +
  'outline-none transition-colors placeholder:text-on-surface-variant/60 ' +
  'focus:border-primary focus:border-2 focus:px-[13px] focus:py-[9px] disabled:opacity-50 disabled:cursor-not-allowed'

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
