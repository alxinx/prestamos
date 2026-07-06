import MenuUsuario from './MenuUsuario'

function IconoHamburguesa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconoCampana() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

const etiquetasRuta = {
  '/dashboard':     'Dashboard',
  '/clientes':      'Clientes',
  '/prestamos':     'Préstamos',
  '/cobros':        'Cobros',
  '/colaboradores': 'Colaboradores',
  '/capital':       'Capital',
  '/tesoreria':     'Tesorería',
  '/reportes':      'Reportes',
  '/configuracion': 'Configuración',
  '/mis-cobros':    'Mis cobros',
  '/historial':     'Historial',
  '/caja/gastos':   'Gastos de campo',
  '/caja/cierre':   'Cierre de caja',
}

const etiquetasRol = {
  ADMINISTRADOR: 'Admin',
  SECRETARIA:    'Secretaria',
  AUDITOR:       'Auditor',
  COBRADOR:      'Cobrador',
}

export default function TopbarTenant({ esMobil, onToggleMenu, nombreNegocio, rol }) {
  const ruta = window.location.pathname
  const nombreSeccion = etiquetasRuta[ruta] ?? 'Panel'
  const iniciales = (nombreNegocio || 'T').substring(0, 2).toUpperCase()

  return (
    <header
      className={`h-[60px] bg-surface-lowest border-b border-outline-variant/40 flex items-center justify-between z-10 shrink-0 gap-3 ${esMobil ? 'px-4' : 'px-7 sticky top-0'}`}
    >
      {/* Izquierda */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {esMobil && (
          <button
            onClick={onToggleMenu}
            aria-label="Abrir menú"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container text-on-surface-variant border-none cursor-pointer hover:bg-surface-high transition-colors duration-150 shrink-0"
          >
            <IconoHamburguesa />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {nombreNegocio && (
            <>
              <span className="text-[12px] text-on-surface-variant truncate">{nombreNegocio}</span>
              <span className="text-outline-variant text-[12px]">/</span>
            </>
          )}
          <span className="text-sm font-semibold text-on-background">{nombreSeccion}</span>
        </div>
      </div>

      {/* Derecha */}
      <div className={`flex items-center shrink-0 ${esMobil ? 'gap-1' : 'gap-2'}`}>
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none text-on-surface-variant cursor-pointer transition-all duration-150 hover:bg-surface-container hover:text-on-background">
          <IconoCampana />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full border-2 bg-secondary-container border-surface-lowest" />
        </button>

        {!esMobil && (
          <>
            <div className="w-px h-6 bg-outline-variant/40 mx-1" />
            <div className="flex items-center gap-2">
              {rol && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary/10 text-secondary">
                  {etiquetasRol[rol] ?? rol}
                </span>
              )}
              <MenuUsuario iniciales={iniciales} />
            </div>
          </>
        )}
      </div>
    </header>
  )
}
