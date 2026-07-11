import { useEffect, useRef, useState } from 'react'
import usePermisos from '../../hooks/usePermisos'
import { IcoMas, IcoConfiguracion } from './iconos'

function IcoPersonaMas() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  )
}

const OPCIONES_CREAR = [
  { etiqueta: 'Crear nuevo préstamo', icono: <IcoMas size={15} />, href: '/prestamos/nuevo', permiso: 'creditos.crear' },
  { etiqueta: 'Crear nuevo cliente', icono: <IcoPersonaMas />, href: '/clientes/nuevo', permiso: 'clientes.crear' },
]

// Menú desplegable DRY del avatar de usuario — cierra al hacer clic fuera.
// Las opciones de "crear" se ocultan si el colaborador no tiene el permiso correspondiente.
export default function MenuUsuario({ iniciales }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()
  const opcionesCrear = cargandoPermisos ? [] : OPCIONES_CREAR.filter(op => tienePermiso(op.permiso))

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
        aria-label="Abrir menú"
        className="w-9 h-9 rounded-full border-2 border-secondary-container/30 flex items-center justify-center text-[13px] font-bold font-sans cursor-pointer shrink-0 text-secondary-container bg-[linear-gradient(135deg,var(--color-primary-container),var(--color-primary))] transition-shadow duration-150 hover:shadow-[0_0_0_3px_rgba(86,251,171,0.25)]"
      >
        {iniciales}
      </button>

      {abierto && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[240px] bg-surface-lowest border border-outline-variant/50 rounded-xl shadow-card-hover overflow-hidden z-[100] animate-[slideDown_0.15s_ease]">
          {opcionesCrear.length > 0 && (
            <>
              <div className="p-1.5">
                {opcionesCrear.map(op => (
                  <a
                    key={op.etiqueta}
                    href={op.href}
                    onClick={() => setAbierto(false)}
                    className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-on-surface-variant text-[13px] no-underline transition-colors duration-100 hover:bg-primary hover:text-secondary-container"
                  >
                    <span className="text-secondary shrink-0 group-hover:text-secondary-container">{op.icono}</span>
                    {op.etiqueta}
                  </a>
                ))}
              </div>

              <div className="h-[3px] bg-outline-variant/60" />
            </>
          )}

          <div className="p-1.5">
            <a
              href="/configuracion"
              onClick={() => setAbierto(false)}
              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-on-surface-variant text-[13px] no-underline transition-colors duration-100 hover:bg-primary hover:text-secondary-container"
            >
              <span className="text-on-surface-variant shrink-0 group-hover:text-secondary-container"><IcoConfiguracion size={15} /></span>
              Configuración
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
