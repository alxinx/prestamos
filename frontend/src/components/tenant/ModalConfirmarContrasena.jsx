import { useState } from 'react'
import { createPortal } from 'react-dom'
import CampoContrasena from './CampoContrasena'
import BotonAccion from './BotonAccion'
import { IcoCandado } from './iconos'

/**
 * Segundo paso DRY para acciones sensibles: pide reconfirmar la contraseña del
 * usuario autenticado antes de ejecutar algo destructivo (ej. suspender un
 * capital). No valida nada en el cliente — `onConfirmar(password)` debe llamar al
 * backend real; si el backend rechaza la contraseña, lanza un Error y este modal
 * lo muestra sin cerrarse, para que el usuario reintente.
 *
 * Pensado para reutilizarse en cualquier otra acción futura que necesite el mismo
 * "vuelve a escribir tu contraseña para continuar" — no es específico de capital.
 */
export default function ModalConfirmarContrasena({ titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar' }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function manejarConfirmar() {
    if (!password) { setError('Ingresa tu contraseña.'); return }
    setError('')
    setEnviando(true)
    try {
      await onConfirmar(password)
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.')
    } finally {
      setEnviando(false)
    }
  }

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}
      className="fixed inset-0 z-[300] bg-on-background/50 backdrop-blur-[4px] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[400px] bg-surface-lowest rounded-2xl shadow-card-hover animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-primary/10 text-primary">
            <IcoCandado size={22} />
          </div>
          <h2 className="text-[16px] font-bold text-on-background m-0 mb-2">{titulo}</h2>
          {mensaje && <p className="text-[13px] text-on-surface-variant m-0 mb-4 leading-relaxed">{mensaje}</p>}

          <div className="w-full text-left">
            <CampoContrasena
              etiqueta="Tu contraseña"
              valor={password}
              onChange={v => { setPassword(v); setError('') }}
              autoComplete="current-password"
              requerido
            />
          </div>
          {error && <p className="text-[12px] text-error mt-2 w-full text-left">{error}</p>}
        </div>

        <div className="px-6 pb-6 flex gap-2.5">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="flex-1 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer font-sans hover:bg-surface-high transition-all duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <BotonAccion
            type="button"
            variante="peligro"
            onClick={manejarConfirmar}
            disabled={enviando}
            cargando={enviando}
            className="flex-1"
          >
            {enviando ? 'Verificando...' : textoConfirmar}
          </BotonAccion>
        </div>

      </div>
    </div>,
    document.body
  )
}
