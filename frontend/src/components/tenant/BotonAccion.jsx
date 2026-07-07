// Botón de acción DRY (fondo secondary-container, máximo contraste) — para acciones tipo "Crear...".
export default function BotonAccion({ children, icono, href, onClick, type = 'button', disabled = false, className = '' }) {
  const clases = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-container text-primary text-sm font-semibold whitespace-nowrap no-underline hover:brightness-95 active:brightness-90 transition-all duration-150 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 ${className}`

  if (href) {
    return (
      <a href={href} className={clases}>
        {icono}
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clases}>
      {icono}
      {children}
    </button>
  )
}
