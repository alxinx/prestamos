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
      className={`h-[60px] backdrop-blur-[12px] border-b flex items-center justify-between sticky top-0 z-10 shrink-0 gap-3 ${esMobil ? 'px-4' : 'px-7'}`}
      style={{ background: 'rgba(6,15,30,0.85)', borderBottomColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Izquierda */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {esMobil && (
          <button
            onClick={onToggleMenu}
            aria-label="Abrir menú"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.06] text-slate-50 border-none cursor-pointer hover:bg-white/[0.12] transition-colors duration-150 shrink-0"
          >
            <IconoHamburguesa />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {nombreNegocio && (
            <>
              <span className="text-[12px] text-slate-600 truncate">{nombreNegocio}</span>
              <span className="text-slate-700 text-[12px]">/</span>
            </>
          )}
          <span className="text-sm font-semibold text-slate-50">{nombreSeccion}</span>
        </div>
      </div>

      {/* Derecha */}
      <div className={`flex items-center shrink-0 ${esMobil ? 'gap-1' : 'gap-2'}`}>
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none text-slate-400 cursor-pointer transition-all duration-150 hover:bg-white/[0.08] hover:text-slate-50">
          <IconoCampana />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full border-2" style={{ background: '#56fbab', borderColor: '#060f1e' }} />
        </button>

        {!esMobil && (
          <>
            <div className="w-px h-6 bg-white/[0.08] mx-1" />
            <div className="flex items-center gap-2">
              {rol && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(86,251,171,0.12)', color: '#56fbab' }}>
                  {etiquetasRol[rol] ?? rol}
                </span>
              )}
              <div
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[13px] font-bold font-sans cursor-pointer shrink-0"
                style={{ background: 'linear-gradient(135deg, #002855, #001430)', borderColor: 'rgba(86,251,171,0.3)', color: '#56fbab' }}
              >
                {iniciales}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
