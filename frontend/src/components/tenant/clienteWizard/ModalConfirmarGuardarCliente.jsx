import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IcoCheck } from '../iconos'

// Modal final del wizard de clientes — 3 salidas distintas (no 2, como
// ModalConfirmacion): corregir (vuelve al wizard sin guardar), guardar, o
// guardar y saltar directo al formulario de préstamo con este cliente precargado.
export default function ModalConfirmarGuardarCliente({ nombreCliente, guardando, onCorregir, onGuardar, onGuardarYCrearPrestamo }) {
  useEffect(() => {
    const cerrar = e => { if (e.key === 'Escape' && !guardando) onCorregir() }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [onCorregir, guardando])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget && !guardando) onCorregir() }}
      className="fixed inset-0 z-[300] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[420px] bg-surface-lowest rounded-2xl shadow-card-hover animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-secondary-container/25 text-secondary">
            <IcoCheck size={26} />
          </div>
          <h2 className="text-[16px] font-bold text-on-background m-0 mb-2">¿Confirmas los datos de {nombreCliente}?</h2>
          <p className="text-[13px] text-on-surface-variant m-0 leading-relaxed">
            Revisa que la información sea correcta antes de guardar — podrás corregir cualquier paso del formulario.
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <button
            onClick={onGuardarYCrearPrestamo}
            disabled={guardando}
            className="py-3 rounded-lg bg-secondary-container text-primary text-[13.5px] font-bold cursor-pointer font-sans transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
          >
            {guardando ? 'Guardando...' : 'Guardar y crear préstamo →'}
          </button>
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="py-3 rounded-lg bg-primary text-on-primary text-[13.5px] font-bold cursor-pointer font-sans transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-125"
          >
            {guardando ? 'Guardando...' : 'Guardar cliente'}
          </button>
          <button
            onClick={onCorregir}
            disabled={guardando}
            className="py-2.5 rounded-lg bg-transparent border-none text-on-surface-variant text-[13px] font-medium cursor-pointer font-sans transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:text-on-background"
          >
            Corregir dato
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
