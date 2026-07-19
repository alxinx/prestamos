import { useEffect, useRef, useState } from 'react'
import { IcoOpciones } from './iconos'

// Menú desplegable de acciones genérico para filas de tabla ("..." -> lista de
// acciones) — reemplaza el botón de opciones sin onClick que había en Prestamos.jsx
// y Clientes.jsx. `acciones`: [{ label, icono, onClick, deshabilitado }].
export default function MenuAcciones({ acciones }) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    function cerrarSiAfuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false)
    }
    function cerrarConEsc(e) { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', cerrarSiAfuera)
    document.addEventListener('keydown', cerrarConEsc)
    return () => {
      document.removeEventListener('mousedown', cerrarSiAfuera)
      document.removeEventListener('keydown', cerrarConEsc)
    }
  }, [abierto])

  if (!acciones || acciones.length === 0) return null

  return (
    <div className="relative inline-block" ref={contenedorRef}>
      <button
        type="button"
        aria-label="Más acciones"
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={() => setAbierto(a => !a)}
        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-default transition-colors"
      >
        <IcoOpciones />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[200px] py-1.5 rounded-xl bg-surface-lowest border border-outline-variant/50 shadow-card-hover"
        >
          {acciones.map((accion, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={accion.deshabilitado}
              onClick={() => { setAbierto(false); accion.onClick() }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-on-background hover:bg-surface-default transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {accion.icono}
              {accion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
