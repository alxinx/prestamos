// Fila DRY para un ítem de actividad reciente (pago, crédito vencido, etc).
export default function FilaActividad({ icono, iconoClases, titulo, subtitulo, monto, montoClases, tiempo }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-outline-variant/40 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconoClases}`}>
          {icono}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-on-background leading-tight truncate">{titulo}</p>
          <p className="text-[12px] text-on-surface-variant truncate">{subtitulo}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-[13px] font-bold ${montoClases}`}>{monto}</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">{tiempo}</p>
      </div>
    </div>
  )
}
