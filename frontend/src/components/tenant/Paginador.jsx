// Paginador DRY para tablas del panel tenant — números de página + prev/next.
export default function Paginador({ pagina, totalPaginas, onChange }) {
  const paginas = Array.from({ length: Math.max(totalPaginas, 1) }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        className="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant text-sm bg-surface-lowest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-default transition-colors"
      >
        ‹
      </button>

      {paginas.map(n => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors ${
            n === pagina
              ? 'bg-secondary-container/25 border-2 border-secondary text-on-secondary-container'
              : 'border border-outline-variant text-on-surface-variant bg-surface-lowest hover:bg-surface-default'
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(pagina + 1)}
        disabled={pagina >= totalPaginas}
        aria-label="Página siguiente"
        className="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant text-sm bg-surface-lowest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-default transition-colors"
      >
        ›
      </button>
    </div>
  )
}
