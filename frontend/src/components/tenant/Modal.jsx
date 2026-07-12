import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IcoX } from './iconos'

// Shell DRY de modal grande (header con título/X + cuerpo con scroll + footer) —
// bloquea el scroll del body, cierra con Escape o clic fuera del contenido, y monta
// vía portal. Usado por ModalEditarColaborador y ModalCrearCapitalSocio; distinto de
// ModalConfirmacion, que es más chico y no lleva header propio.
export default function Modal({ titulo, subtitulo, onCerrar, children, footer, ancho = '70vw' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const cerrarEsc = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', cerrarEsc)
    return () => document.removeEventListener('keydown', cerrarEsc)
  }, [onCerrar])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar() }}
      className="fixed inset-0 z-[200] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-4"
    >
      <div
        style={{ width: ancho, maxWidth: ancho }}
        className="max-sm:w-[94vw] max-sm:max-w-[94vw] max-h-[85vh] bg-surface-lowest rounded-2xl shadow-card-hover flex flex-col overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        <div className="px-6 py-4 border-b border-outline-variant/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-on-background m-0">{titulo}</h2>
            {subtitulo && <p className="text-[12px] text-on-surface-variant m-0">{subtitulo}</p>}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-default border-none text-on-surface-variant cursor-pointer hover:bg-surface-high transition-colors"
          >
            <IcoX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-outline-variant/50 shrink-0 flex flex-col gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
