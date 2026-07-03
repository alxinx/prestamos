import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'

function IconoCandado() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconoOjo({ visible }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

function IconoCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconoX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ReglasPassword({ valor }) {
  const reglas = [
    { texto: 'Mínimo 8 caracteres', ok: valor.length >= 8 },
    { texto: 'Al menos una mayúscula', ok: /[A-Z]/.test(valor) },
    { texto: 'Al menos un número', ok: /[0-9]/.test(valor) },
  ]
  if (!valor) return null
  return (
    <div className="mt-2 flex flex-col gap-1">
      {reglas.map(r => (
        <div key={r.texto} className={`flex items-center gap-1.5 text-[12px] ${r.ok ? 'text-admin-accent' : 'text-slate-500'}`}>
          <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${r.ok ? 'bg-[rgba(0,201,130,0.15)] text-admin-accent' : 'bg-white/[0.05] text-slate-600'}`}>
            {r.ok ? <IconoCheck /> : <span className="text-[8px]">●</span>}
          </span>
          {r.texto}
        </div>
      ))}
    </div>
  )
}

function CampoPassword({ id, label, valor, onChange, placeholder }) {
  const [visible, setVisible] = useState(false)
  const [enfocado, setEnfocado] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-400 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${enfocado ? 'text-admin-accent' : 'text-slate-600'}`}>
          <IconoCandado />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          className={`w-full py-2.5 pl-9 pr-10 bg-white/[0.04] rounded-lg text-slate-50 text-sm font-sans outline-none box-border transition-[border-color,box-shadow] duration-150
            ${enfocado
              ? 'border-[1.5px] border-[rgba(0,201,130,0.5)] shadow-[0_0_0_3px_rgba(0,201,130,0.08)]'
              : 'border-[1.5px] border-white/10'
            }`}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-600 flex items-center p-1"
        >
          <IconoOjo visible={visible} />
        </button>
      </div>
    </div>
  )
}

export default function ModalConfigUsuario({ onCerrar }) {
  const { token, renovarToken } = useAuth()
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const refModal = useRef(null)

  useEffect(() => {
    function manejarTeclado(e) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTeclado)
    return () => document.removeEventListener('keydown', manejarTeclado)
  }, [onCerrar])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const passwordValido =
    nuevaContrasena.length >= 8 &&
    /[A-Z]/.test(nuevaContrasena) &&
    /[0-9]/.test(nuevaContrasena)

  const coinciden = nuevaContrasena === confirmarContrasena && confirmarContrasena !== ''

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')

    if (!contrasenaActual) { setError('Ingresa tu contraseña actual.'); return }
    if (!passwordValido) { setError('La nueva contraseña no cumple los requisitos.'); return }
    if (!coinciden) { setError('Las contraseñas no coinciden.'); return }

    setEnviando(true)
    try {
      let tokenActual = token
      if (!tokenActual) tokenActual = await renovarToken()

      const res = await fetch('/api/master-admin/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenActual}`,
        },
        body: JSON.stringify({ contrasenaActual, nuevaContrasena, confirmarContrasena }),
      })

      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'Error al cambiar la contraseña.')
        return
      }
      setExito(true)
      setTimeout(onCerrar, 1800)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-[6px] overflow-y-auto flex flex-col p-6 box-border animate-[fadeIn_0.2s_ease]"
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        ref={refModal}
        className="w-full max-w-[440px] m-auto bg-gradient-to-br from-[#0F2337] to-[#0A1A2E] border border-white/10 rounded-[20px] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-[18px] border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,201,130,0.12)] flex items-center justify-center text-admin-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-50 m-0 tracking-[-0.01em]">
                Configuración de Usuario
              </h2>
              <p className="text-[12px] text-slate-500 m-0">Cambio de contraseña</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border-none text-slate-500 cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-white/10 hover:text-slate-50"
          >
            <IconoX />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {exito ? (
            <div className="text-center py-4 pb-2">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,201,130,0.15)] flex items-center justify-center mx-auto mb-4 text-admin-accent">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-slate-50 m-0 mb-1.5">¡Contraseña actualizada!</p>
              <p className="text-[13px] text-slate-500 m-0">Los cambios se aplicaron correctamente.</p>
            </div>
          ) : (
            <form onSubmit={manejarEnvio} noValidate>
              <div className="flex flex-col gap-[18px]">
                <CampoPassword
                  id="contrasena-actual"
                  label="Contraseña actual"
                  valor={contrasenaActual}
                  onChange={setContrasenaActual}
                  placeholder="••••••••"
                />

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <CampoPassword
                    id="nueva-contrasena"
                    label="Nueva contraseña"
                    valor={nuevaContrasena}
                    onChange={v => { setNuevaContrasena(v); setError('') }}
                    placeholder="••••••••"
                  />
                  <ReglasPassword valor={nuevaContrasena} />
                </div>

                <div>
                  <CampoPassword
                    id="confirmar-contrasena"
                    label="Confirmar nueva contraseña"
                    valor={confirmarContrasena}
                    onChange={v => { setConfirmarContrasena(v); setError('') }}
                    placeholder="••••••••"
                  />
                  {confirmarContrasena && (
                    <p className={`mt-1.5 text-[12px] flex items-center gap-1.5 ${coinciden ? 'text-admin-accent' : 'text-red-400'}`}>
                      {coinciden ? <><IconoCheck /> Las contraseñas coinciden</> : '✗ Las contraseñas no coinciden'}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5 text-[13px] text-red-300">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="flex-1 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-slate-400 text-sm font-medium cursor-pointer font-sans transition-all duration-150 hover:bg-white/[0.08] hover:text-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className={`flex-1 py-2.5 rounded-lg border-none text-primary text-sm font-bold font-sans flex items-center justify-center gap-2 transition-all duration-150
                    ${enviando ? 'bg-[rgba(0,201,130,0.4)] cursor-not-allowed' : 'bg-admin-accent cursor-pointer hover:bg-admin-accent-dark'}`}
                >
                  {enviando ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(0,20,48,0.3)] [border-top-color:#001430] animate-[girar_0.7s_linear_infinite] inline-block" />
                      Guardando...
                    </>
                  ) : 'Guardar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
