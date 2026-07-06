// Card contenedora DRY para paneles del dashboard (header con icono/título + acción opcional + contenido libre).
export default function TarjetaPanel({ icono, iconoClases, titulo, subtitulo, accion, children }) {
  return (
    <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconoClases}`}>
            {icono}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-on-background leading-tight">{titulo}</p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">{subtitulo}</p>
          </div>
        </div>
        {accion}
      </div>

      {children}
    </div>
  )
}
