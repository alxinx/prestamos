import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { claseInput, claseLabel } from '../../lib/estilos'
import { IcoX } from '../iconos'
import { apiFetch } from '../../lib/api'

function CampoTexto({ id, label, valor, onChange, placeholder, tipo = 'text', autoComplete }) {
  const [enfocado, setEnfocado] = useState(false)
  return (
    <div>
      <label htmlFor={id} className={claseLabel}>{label}</label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        className={`w-full px-3.5 py-2.5 rounded-lg text-slate-50 text-sm font-sans outline-none box-border transition-[border-color,box-shadow] duration-150
          ${claseInput}
          ${enfocado
            ? 'border-[1.5px] border-[rgba(86,251,171,0.5)] shadow-[0_0_0_3px_rgba(86,251,171,0.08)]'
            : 'border-[1.5px] border-white/10'
          }`}
      />
    </div>
  )
}

export default function ModalConfigApp({ onCerrar }) {
  useAuth()
  const [form, setForm] = useState({ nombreRazonSocial: '', nit: '', email: '' })
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const refModal = useRef(null)

  useEffect(() => {
    function manejarTeclado(e) { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', manejarTeclado)
    return () => document.removeEventListener('keydown', manejarTeclado)
  }, [onCerrar])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    apiFetch('/api/master-admin/datos-saas')
      .then(({ datos }) => {
        if (datos.datos) {
          setForm({
            nombreRazonSocial: datos.datos.nombreRazonSocial,
            nit:               datos.datos.nit,
            email:             datos.datos.email,
          })
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  function cambiar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setError('')
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')

    if (!form.nombreRazonSocial.trim()) { setError('El nombre o razón social es requerido.'); return }
    if (!form.nit.trim()) { setError('El NIT es requerido.'); return }
    if (!form.email.trim()) { setError('El email es requerido.'); return }

    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/master-admin/datos-saas', { method: 'PUT', body: form })
      if (!ok) { setError(datos.error || 'Error al guardar.'); return }
      setExito(true)
      setTimeout(onCerrar, 1600)
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
        className="w-full max-w-[460px] m-auto bg-gradient-to-br from-[#0F2337] to-[#0A1A2E] border border-white/10 rounded-[20px] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-[18px] border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(170,199,253,0.1)] flex items-center justify-center text-[#aac7fd]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-50 m-0 tracking-[-0.01em]">Configuración de Aplicación</h2>
              <p className="text-[12px] text-slate-500 m-0">Datos de facturación del SaaS</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border-none text-slate-500 cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-white/10 hover:text-slate-50"
          >
            <IcoX />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {cargando ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 rounded-full border-[3px] border-[rgba(170,199,253,0.2)] [border-top-color:#aac7fd] animate-[girar_0.8s_linear_infinite]" />
            </div>
          ) : exito ? (
            <div className="text-center py-4 pb-2">
              <div className="w-14 h-14 rounded-full bg-[rgba(86,251,171,0.15)] flex items-center justify-center mx-auto mb-4 text-admin-accent">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-slate-50 m-0 mb-1.5">¡Datos guardados!</p>
              <p className="text-[13px] text-slate-500 m-0">La configuración se actualizó correctamente.</p>
            </div>
          ) : (
            <form onSubmit={manejarEnvio} noValidate>
              <div className="flex flex-col gap-4">
                <CampoTexto
                  id="nombre-razon-social"
                  label="Nombre completo o razón social"
                  valor={form.nombreRazonSocial}
                  onChange={v => cambiar('nombreRazonSocial', v)}
                  placeholder="Ej: GotaPay SAS"
                  autoComplete="organization"
                />
                <CampoTexto
                  id="nit"
                  label="NIT"
                  valor={form.nit}
                  onChange={v => cambiar('nit', v)}
                  placeholder="Ej: 900123456-7"
                />
                <CampoTexto
                  id="email-app"
                  label="Email de facturación"
                  valor={form.email}
                  onChange={v => cambiar('email', v)}
                  placeholder="facturacion@gotapay.co"
                  tipo="email"
                  autoComplete="email"
                />

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
                    ${enviando ? 'bg-[rgba(86,251,171,0.4)] cursor-not-allowed' : 'bg-admin-accent cursor-pointer hover:bg-admin-accent-dark'}`}
                >
                  {enviando ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(0,20,48,0.3)] [border-top-color:#001430] animate-[girar_0.7s_linear_infinite] inline-block" />
                      Guardando...
                    </>
                  ) : 'Guardar'}
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
