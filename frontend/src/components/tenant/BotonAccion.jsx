// Botón de acción DRY (fondo secondary-container, máximo contraste) — para acciones tipo "Crear...".
export default function BotonAccion({ children, icono, href, onClick, className = '' }) {
  const clases = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-container text-primary text-sm font-semibold whitespace-nowrap no-underline hover:brightness-95 active:brightness-90 transition-all duration-150 shrink-0 ${className}`

  if (href) {
    return (
      <a href={href} className={clases}>
        {icono}
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={clases}>
      {icono}
      {children}
    </button>
  )
}
