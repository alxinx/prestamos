import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const VARIANTES = {
  advertencia: {
    iconoBg: 'bg-error-container',
    iconoColor: 'var(--color-error)',
    btnConfirmar: 'bg-error text-on-primary hover:brightness-110',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  confirmacion: {
    iconoBg: 'bg-secondary-container/25',
    iconoColor: 'var(--color-secondary)',
    btnConfirmar: 'bg-primary text-on-primary hover:brightness-125',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
}

/**
 * Modal de confirmación DRY (tenant, tema claro) — mismo comportamiento que
 * ModalAlerta de master-admin, adaptado al sistema de diseño claro de GotaPay.
 *
 * Props:
 *   tipo            – 'advertencia' | 'confirmacion'
 *   titulo, mensaje – contenido del modal
 *   onConfirmar     – callback al confirmar
 *   onCancelar      – callback al cancelar / cerrar
 *   textoConfirmar  – texto del botón de acción (default según tipo)
 *   textoCancelar   – texto del botón de cancelar (default 'Cancelar')
 */
export default function ModalConfirmacion({
  tipo = 'advertencia',
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar,
  textoCancelar = 'Cancelar',
}) {
  const v = VARIANTES[tipo] ?? VARIANTES.advertencia
  const textoBtn = textoConfirmar ?? (tipo === 'confirmacion' ? 'Confirmar' : 'Sí, continuar')

  useEffect(() => {
    const cerrar = e => { if (e.key === 'Escape') onCancelar() }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [onCancelar])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}
      className="fixed inset-0 z-[300] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[400px] bg-surface-lowest rounded-2xl shadow-card-hover animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${v.iconoBg}`} style={{ color: v.iconoColor }}>
            {v.icono}
          </div>
          <h2 className="text-[16px] font-bold text-on-background m-0 mb-2">{titulo}</h2>
          <div className="text-[13px] text-on-surface-variant m-0 leading-relaxed">{mensaje}</div>
        </div>

        <div className="px-6 pb-6 flex gap-2.5">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer font-sans hover:bg-surface-high transition-all duration-150"
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
