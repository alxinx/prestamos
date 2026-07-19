import { useAuth } from '../../context/AuthContext'

const elementosNav = [
  {
    etiqueta: 'Dashboard',
    ruta: '/master-admin/dashboard',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    etiqueta: 'Tenants',
    ruta: '/master-admin/tenants',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    etiqueta: 'Planes',
    ruta: '/master-admin/plans',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    etiqueta: 'Facturación',
    ruta: '/master-admin/billing',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    etiqueta: 'Suspensiones',
    ruta: '/master-admin/suspensions',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
  {
    etiqueta: 'Auditoría',
    ruta: '/master-admin/audit',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

function ItemNav({ elemento, activo, onClick }) {
  const estaActivo = activo === elemento.ruta

  return (
    <a
      href={elemento.ruta}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] no-underline text-sm transition-all duration-150 cursor-pointer
        ${estaActivo
          ? 'text-admin-accent bg-[rgba(86,251,171,0.1)] shadow-[0_0_0_1px_rgba(86,251,171,0.15)] font-semibold'
          : 'text-slate-400 font-normal hover:bg-white/[0.05] hover:text-slate-50'
        }`}
    >
      <span className={`shrink-0 ${estaActivo ? 'opacity-100' : 'opacity-70'}`}>
        {elemento.icono}
      </span>
      {elemento.etiqueta}
    </a>
  )
}

export default function Sidebar({ rutaActiva, esMobil, menuAbierto, onCerrar }) {
  const { cerrarSesion } = useAuth()

  async function manejarCierreSesion() {
    await cerrarSesion()
    window.location.href = '/'
  }

  return (
    <aside className={`
      w-[260px] h-screen flex flex-col shrink-0
      bg-gradient-to-b from-[#102A43] to-[#0D2137]
      border-r border-white/[0.06]
      ${esMobil
        ? 'fixed top-0 left-0 z-50 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform'
        : 'sticky top-0'
      }
      ${esMobil ? (menuAbierto ? 'translate-x-0' : '-translate-x-full') : ''}
    `}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06] flex items-center justify-between">
        <a href="/master-admin/dashboard" className="flex items-center gap-2.5 no-underline">
          <img src="/isotipo.webp" alt="GotaPay" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-50 tracking-[-0.02em]">
            Gota<span className="text-admin-accent">Pay</span>
          </span>
        </a>

        {esMobil && (
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border-none text-slate-400 cursor-pointer shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {elementosNav.map(el => (
          <ItemNav
            key={el.ruta}
            elemento={el}
            activo={rutaActiva}
            onClick={esMobil ? onCerrar : undefined}
          />
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="px-3 pb-6 pt-4 border-t border-white/[0.06]">
        <button
          onClick={manejarCierreSesion}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] bg-transparent border-none text-slate-400 text-sm cursor-pointer font-sans transition-all duration-150 hover:bg-[rgba(249,115,22,0.1)] hover:text-[#F97316] text-left"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
