// Fila DRY para un ítem de próximo vencimiento (cliente, monto, fecha).
export default function FilaVencimiento({ nombre, monto, fecha }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-outline-variant/40 last:border-0">
      <span className="text-[13px] font-semibold text-on-background truncate">{nombre}</span>
      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        <span className="text-[13px] font-bold text-on-background">{monto}</span>
        <span className="text-[12px] text-on-surface-variant w-14 text-right">{fecha}</span>
      </div>
    </div>
  )
}
