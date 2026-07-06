// Fila DRY de icono + etiqueta + valor, usada en listados de métricas dentro de paneles.
export default function FilaDato({ icono, iconoClases, etiqueta, valor, valorClases = 'text-on-background' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconoClases}`}>
          {icono}
        </span>
        <span className="text-[13px] text-on-surface-variant">{etiqueta}</span>
      </div>
      <span className={`text-[14px] font-bold ${valorClases}`}>{valor}</span>
    </div>
  )
}
