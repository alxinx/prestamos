// Variantes de botón del sistema de diseño — 'accion' (verde, máximo contraste) es la
// original y sigue siendo el default para no romper los usos existentes de BotonAccion.
const VARIANTES = {
  primario:   'bg-primary text-on-primary hover:brightness-125 active:brightness-150',
  accion:     'bg-secondary-container text-primary hover:brightness-95 active:brightness-90',
  secundario: 'bg-transparent text-on-background border border-outline-variant hover:bg-surface-default active:bg-surface-default',
  peligro:    'bg-error text-on-primary hover:brightness-110 active:brightness-95',
}

function IcoCargando() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Botón DRY con variantes (primario/accion/secundario/peligro) y estado de carga — para
// cualquier acción de formulario del tenant, desde "Crear..." hasta "Eliminar".
export default function BotonAccion({ children, icono, href, onClick, type = 'button', disabled = false, cargando = false, variante = 'accion', className = '' }) {
  const deshabilitado = disabled || cargando
  const clases = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap no-underline transition-all duration-150 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 ${VARIANTES[variante] || VARIANTES.accion} ${className}`

  if (href && !deshabilitado) {
    return (
      <a href={href} className={clases}>
        {icono}
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={deshabilitado} className={clases}>
      {cargando ? <IcoCargando /> : icono}
      {children}
    </button>
  )
}
