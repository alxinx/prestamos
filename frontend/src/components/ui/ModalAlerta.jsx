import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const VARIANTES = {
  advertencia: {
    iconoBg:  'bg-yellow-500/10 border-yellow-500/20',
    iconoColor: '#FBBF24',
    btnConfirmar: 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  confirmacion: {
    iconoBg:  'bg-[rgba(86,251,171,0.1)] border-[rgba(86,251,171,0.2)]',
    iconoColor: '#56fbab',
    btnConfirmar: 'border-none bg-admin-accent text-primary hover:bg-admin-accent-dark',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
      </svg>
    ),
  },
  error: {
    iconoBg:  'bg-red-500/10 border-red-500/20',
    iconoColor: '#EF4444',
    btnConfirmar: 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
}

/**
 * Modal de alerta reutilizable.
 *
 * Props:
 *   tipo            – 'advertencia' | 'confirmacion' | 'error'
 *   titulo          – título del modal
 *   mensaje         – nodo React o string con el cuerpo (puede incluir <span> para resaltar)
 *   onConfirmar     – callback al confirmar (omitir para modales de solo error)
 *   onCancelar      – callback al cancelar / cerrar
 *   textoConfirmar  – texto del botón de acción (default según tipo)
 *   textoCancelar   – texto del botón de cancelar (default 'Cancelar')
 */
export default function ModalAlerta({
  tipo = 'advertencia',
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar,
  textoCancelar = 'Cancelar',
}) {
  const v = VARIANTES[tipo] ?? VARIANTES.advertencia

  const textoBtn = textoConfirmar ?? {
    advertencia:  'Continuar',
    confirmacion: 'Confirmar',
    error:        'Entendido',
  }[tipo]

  useEffect(() => {
    const cerrar = e => { if (e.key === 'Escape') onCancelar() }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [onCancelar])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}
      className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-[6px] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[400px] bg-gradient-to-br from-[#0F2337] to-[#0A1A2E] border border-white/10 rounded-[20px] shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 ${v.iconoBg}`}
            style={{ color: v.iconoColor }}>
            {v.icono}
          </div>
          <h2 className="text-[16px] font-bold text-slate-50 m-0 mb-2">{titulo}</h2>
          <div className="text-[13px] text-slate-400 m-0 leading-relaxed">{mensaje}</div>
        </div>

        <div className="px-6 pb-6 flex gap-2.5">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[13px] font-medium cursor-pointer font-sans hover:bg-white/[0.08] hover:text-slate-50 transition-all duration-150"
          >
            {textoCancelar}
          </button>
          {onConfirmar && (
            <button
              onClick={onConfirmar}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer font-sans transition-all duration-150 ${v.btnConfirmar}`}
            >
              {textoBtn}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
