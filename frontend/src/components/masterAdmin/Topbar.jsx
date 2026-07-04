import { useState, useRef, useEffect } from 'react'
import ModalConfigUsuario from './ModalConfigUsuario'
import ModalConfigApp from './ModalConfigApp'

const etiquetasRuta = {
  '/master-admin/dashboard':   'Dashboard',
  '/master-admin/tenants':     'Tenants',
  '/master-admin/plans':       'Planes',
  '/master-admin/billing':     'Facturación',
  '/master-admin/suspensions': 'Suspensiones',
  '/master-admin/audit':       'Auditoría',
}

function NombreRuta() {
  const ruta = window.location.pathname
  const nombre = etiquetasRuta[ruta] ?? 'Master Admin'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-slate-600">Master Admin</span>
      <span className="text-slate-700 text-[12px]">/</span>
      <span className="text-sm font-semibold text-slate-50">{nombre}</span>
    </div>
  )
}

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

function IconoAjustes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconoUsuario() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconoApp() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

function MenuSettings() {
  const [abierto, setAbierto] = useState(false)
  const [modalUsuario, setModalUsuario] = useState(false)
  const [modalApp, setModalApp] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function cerrarAlClickExterno(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    if (abierto) document.addEventListener('mousedown', cerrarAlClickExterno)
    return () => document.removeEventListener('mousedown', cerrarAlClickExterno)
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(v => !v)}
        aria-label="Ajustes"
        className={`flex items-center justify-center w-9 h-9 rounded-lg border-none cursor-pointer transition-all duration-150 shrink-0
          ${abierto
            ? 'bg-white/10 text-slate-50'
            : 'bg-transparent text-slate-400 hover:bg-white/[0.08] hover:text-slate-50'
          }`}
      >
        <IconoAjustes />
      </button>

      {abierto && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[230px] bg-[#0F2337] border border-white/10 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-[slideDown_0.15s_ease]">
          <div className="px-3.5 pt-2.5 pb-2 border-b border-white/[0.06]">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.06em] m-0">
              Ajustes
            </p>
          </div>
          <div className="p-1.5">
            {[
              { etiqueta: 'Configuración de Usuario', icono: <IconoUsuario />, accion: () => { setAbierto(false); setModalUsuario(true) } },
              { etiqueta: 'Configuración de Aplicación', icono: <IconoApp />, accion: () => { setAbierto(false); setModalApp(true) } },
            ].map(op => (
              <button
                key={op.etiqueta}
                onClick={op.accion}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg bg-transparent border-none text-slate-400 text-[13px] cursor-pointer font-sans text-left transition-all duration-100 hover:bg-white/[0.06] hover:text-slate-50"
              >
                <span className="text-slate-500 shrink-0">{op.icono}</span>
                {op.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {modalUsuario && <ModalConfigUsuario onCerrar={() => setModalUsuario(false)} />}
      {modalApp     && <ModalConfigApp     onCerrar={() => setModalApp(false)} />}
    </div>
  )
}

export default function Topbar({ esMobil, onToggleMenu }) {
  return (
    <header className={`h-[60px] bg-[rgba(6,24,43,0.8)] backdrop-blur-[12px] border-b border-white/[0.06] flex items-center justify-between sticky top-0 z-10 shrink-0 gap-3 ${esMobil ? 'px-4' : 'px-7'}`}>

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
        <NombreRuta />
      </div>

      {/* Derecha */}
      <div className={`flex items-center shrink-0 ${esMobil ? 'gap-1' : 'gap-2'}`}>
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none text-slate-400 cursor-pointer transition-all duration-150 hover:bg-white/[0.08] hover:text-slate-50">
          <IconoCampana />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-admin-accent border-2 border-[#06182B]" />
        </button>

        {!esMobil && <MenuSettings />}

        {!esMobil && <div className="w-px h-6 bg-white/[0.08] mx-1" />}

        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-admin-accent to-[#2DD4BF] border-2 border-[rgba(0,201,130,0.3)] flex items-center justify-center cursor-pointer text-[13px] font-bold text-[#06182B] font-sans transition-shadow duration-150 hover:shadow-[0_0_0_3px_rgba(0,201,130,0.2)] shrink-0">
          MA
        </button>
      </div>
    </header>
  )
}
