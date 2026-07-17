import { useState } from 'react'
import { useTenantAuth } from '../../context/TenantAuthContext'
import useTamanoPantalla from '../../hooks/useTamanoPantalla'
import usePermisos from '../../hooks/usePermisos'
import { IcoConfiguracion, IcoPersonas } from './iconos'

// ─── Íconos SVG inline ───────────────────────────────────────────────────────

function IcoDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  )
}

function IcoPrestamos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function IcoCobros() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IcoColaboradores() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}

function IcoCapital() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="7" rx="9" ry="3" />
      <path d="M3 7v10c0 1.66 4 3 9 3s9-1.34 9-3V7" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  )
}

function IcoTesoreria() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}

function IcoReportes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IcoMisCobros() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="16" y2="11" /><line x1="12" y1="16" x2="16" y2="16" />
      <line x1="8" y1="11" x2="8.01" y2="11" /><line x1="8" y1="16" x2="8.01" y2="16" />
    </svg>
  )
}

function IcoHistorial() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IcoCaja() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4z" />
    </svg>
  )
}

function IcoChevron({ abierto }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${abierto ? 'rotate-180' : 'rotate-0'}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Alterna el sidebar entre expandido (con etiquetas) y colapsado (solo íconos) —
// la flecha interna cambia de sentido según el estado.
function IcoAlternarSidebar({ colapsado }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      {colapsado ? <path d="M12 9l2 3-2 3" /> : <path d="M13 9l-2 3 2 3" />}
    </svg>
  )
}

function IcoCerrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IcoCerrarSesion() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ─── Ítem de nav simple ───────────────────────────────────────────────────────

function ItemNav({ icono, etiqueta, ruta, rutaActiva, onClick, colapsado }) {
  const activo = rutaActiva === ruta || rutaActiva.startsWith(ruta + '/')

  return (
    <a
      href={ruta}
      onClick={onClick}
      title={colapsado ? etiqueta : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] no-underline text-sm transition-all duration-150 cursor-pointer
        ${colapsado ? 'justify-center' : ''}
        ${activo
          ? 'text-secondary-container bg-secondary-container/10 shadow-[0_0_0_1px_rgba(86,251,171,0.15)] font-semibold'
          : 'text-slate-400 font-normal hover:bg-white/[0.05] hover:text-slate-50'
        }`}
    >
      <span className={`shrink-0 ${activo ? 'opacity-100' : 'opacity-70'}`}>{icono}</span>
      {!colapsado && etiqueta}
    </a>
  )
}

// ─── Ítem desplegable (para "Caja") ──────────────────────────────────────────

function ItemDesplegable({ icono, etiqueta, subitems, rutaActiva, onClick, colapsado, onExpandirSidebar }) {
  const algunActivo = subitems.some(s => rutaActiva === s.ruta || rutaActiva.startsWith(s.ruta))
  const [abierto, setAbierto] = useState(algunActivo)

  return (
    <div>
      <button
        onClick={() => (colapsado ? onExpandirSidebar() : setAbierto(v => !v))}
        title={colapsado ? etiqueta : undefined}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] bg-transparent border-none text-sm cursor-pointer font-sans text-left transition-all duration-150
          ${colapsado ? 'justify-center' : ''}
          ${algunActivo
            ? 'text-secondary-container bg-secondary-container/10 shadow-[0_0_0_1px_rgba(86,251,171,0.15)]'
            : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-50'
          }`}
      >
        <span className={`shrink-0 ${algunActivo ? 'opacity-100' : 'opacity-70'}`}>{icono}</span>
        {!colapsado && (
          <>
            <span className="flex-1">{etiqueta}</span>
            <IcoChevron abierto={abierto} />
          </>
        )}
      </button>

      {!colapsado && abierto && (
        <div className="mt-1 ml-6 flex flex-col gap-0.5 border-l border-white/[0.08] pl-3">
          {subitems.map(s => {
            const activo = rutaActiva === s.ruta
            return (
              <a
                key={s.ruta}
                href={s.ruta}
                onClick={onClick}
                className={`block px-2 py-2 rounded-lg no-underline text-[13px] transition-all duration-150
                  ${activo
                    ? 'text-secondary-container font-semibold'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
              >
                {s.etiqueta}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar principal ────────────────────────────────────────────────────────

export const navAdmin = [
  { etiqueta: 'Dashboard',      ruta: '/dashboard',      icono: <IcoDashboard /> },
  { etiqueta: 'Clientes',       ruta: '/clientes',       icono: <IcoPersonas size={18} /> },
  { etiqueta: 'Préstamos',      ruta: '/prestamos',      icono: <IcoPrestamos /> },
  { etiqueta: 'Intereses',      ruta: '/intereses',         icono: <IcoCobros /> },
  { etiqueta: 'Colaboradores',  ruta: '/colaboradores',  icono: <IcoColaboradores /> },
  { etiqueta: 'Capital y Socios', ruta: '/capital',       icono: <IcoCapital />, permiso: 'capital.ver' },
  { etiqueta: 'Tesorería',      ruta: '/tesoreria',      icono: <IcoTesoreria /> },
  { etiqueta: 'Reportes',       ruta: '/reportes',       icono: <IcoReportes /> },
  { etiqueta: 'Configuración',  ruta: '/configuracion',  icono: <IcoConfiguracion /> },
]

export const navCobrador = [
  { etiqueta: 'Mis cobros', ruta: '/mis-cobros', icono: <IcoMisCobros /> },
  { etiqueta: 'Historial',  ruta: '/historial',  icono: <IcoHistorial /> },
]

export const subitemsCaja = [
  { etiqueta: 'Gastos de campo', ruta: '/caja/gastos', permiso: 'caja.registrar_gasto' },
  { etiqueta: 'Cierre de caja',  ruta: '/caja/cierre',  permiso: 'caja.cerrar_individual' },
]

export default function SidebarTenant({ rutaActiva, rol, menuAbierto, onCerrar }) {
  const { cerrarSesion } = useTenantAuth()
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()
  const esCobrador = rol === 'COBRADOR'
  const navAdminPermitido = cargandoPermisos ? [] : navAdmin.filter(el => !el.permiso || tienePermiso(el.permiso))
  const subitemsCajaPermitidos = cargandoPermisos ? [] : subitemsCaja.filter(s => tienePermiso(s.permiso))

  // ≤768px (celular): cajón deslizable clásico, controlado por el hamburguesa del topbar.
  // 769–1024px (tablet): sidebar fijo, colapsado a solo íconos por defecto, con botón propio
  // para expandir/contraer. >1024px: siempre expandido.
  const esMobil = useTamanoPantalla(768)
  const esTablet = useTamanoPantalla(1024) && !esMobil
  const [expandido, setExpandido] = useState(false)
  const colapsado = esTablet && !expandido

  return (
    <aside className={`
      ${esMobil || !colapsado ? 'w-[260px]' : 'w-[76px]'}
      h-dvh flex flex-col shrink-0
      bg-gradient-to-b from-primary to-primary-dark
      border-r border-white/[0.06]
      ${esMobil
        ? 'fixed top-0 left-0 z-50 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform'
        : 'sticky top-0 transition-[width] duration-300 ease-in-out'
      }
      ${esMobil ? (menuAbierto ? 'translate-x-0' : '-translate-x-full') : ''}
    `}>
      {/* Logo */}
      <div className={`px-5 pt-6 pb-5 border-b border-white/[0.06] flex items-center ${colapsado ? 'justify-center px-0' : 'justify-between'}`}>
        <a href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <img src="/isotipo.webp" alt="GotaPay" className="h-8 w-auto shrink-0" />
          {!colapsado && (
            <span className="text-lg font-bold text-slate-50 tracking-[-0.02em] whitespace-nowrap">
              Gota<span className="text-secondary-container">Pay</span>
            </span>
          )}
        </a>

        {esMobil && (
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border-none text-slate-400 cursor-pointer shrink-0"
          >
            <IcoCerrar />
          </button>
        )}

        {esTablet && !colapsado && (
          <button
            onClick={() => setExpandido(false)}
            aria-label="Colapsar menú"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border-none text-slate-400 cursor-pointer shrink-0"
          >
            <IcoAlternarSidebar colapsado={false} />
          </button>
        )}
      </div>

      {esTablet && colapsado && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setExpandido(true)}
            aria-label="Expandir menú"
            className="flex items-center justify-center w-full h-9 rounded-lg bg-white/[0.06] border-none text-slate-400 cursor-pointer"
          >
            <IcoAlternarSidebar colapsado />
          </button>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {!esCobrador && navAdminPermitido.map(el => (
          <ItemNav
            key={el.ruta}
            icono={el.icono}
            etiqueta={el.etiqueta}
            ruta={el.ruta}
            rutaActiva={rutaActiva}
            colapsado={colapsado}
            onClick={esMobil ? onCerrar : undefined}
          />
        ))}

        {esCobrador && (
          <>
            {navCobrador.map(el => (
              <ItemNav
                key={el.ruta}
                icono={el.icono}
                etiqueta={el.etiqueta}
                ruta={el.ruta}
                rutaActiva={rutaActiva}
                colapsado={colapsado}
                onClick={esMobil ? onCerrar : undefined}
              />
            ))}
            {subitemsCajaPermitidos.length > 0 && (
              <ItemDesplegable
                icono={<IcoCaja />}
                etiqueta="Caja"
                subitems={subitemsCajaPermitidos}
                rutaActiva={rutaActiva}
                colapsado={colapsado}
                onClick={esMobil ? onCerrar : undefined}
                onExpandirSidebar={() => setExpandido(true)}
              />
            )}
          </>
        )}
      </nav>

      {/* Cerrar sesión */}
      <div className="px-3 pb-6 pt-4 border-t border-white/[0.06]">
        <button
          onClick={cerrarSesion}
          title={colapsado ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] bg-transparent border-none text-slate-400 text-sm cursor-pointer font-sans transition-all duration-150 hover:bg-[rgba(249,115,22,0.1)] hover:text-[#F97316] text-left ${colapsado ? 'justify-center' : ''}`}
        >
          <IcoCerrarSesion />
          {!colapsado && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
