// Gráfico de barras vertical DRY, para distribuciones por categoría (ej. mora por rango de días).
export default function GraficoBarras({ datos, alturaMax = 110 }) {
  const max = Math.max(...datos.map(d => d.valor), 1)

  return (
    <div className="flex items-end justify-between gap-3 sm:gap-4 flex-1" style={{ minHeight: alturaMax + 44 }}>
      {datos.map(d => {
        const alturaBarra = Math.max(6, (d.valor / max) * alturaMax)
        return (
          <div key={d.etiqueta} className="flex flex-col items-center gap-2 flex-1">
            <span className="text-[13px] font-bold text-on-background">{d.valor}</span>
            <div className={`w-full max-w-[46px] rounded-t-lg ${d.claseColor}`} style={{ height: alturaBarra }} />
            <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{d.etiqueta}</span>
          </div>
        )
      })}
    </div>
  )
}
