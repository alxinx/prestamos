import { useState } from 'react'
import { IcoOjo, IcoOjoTachado } from '../components/iconos'
import { reglasContrasena, contrasenaEsValida } from '../lib/validacionContrasena'
import { apiFetch } from '../lib/api'
import { useMostrarContrasena } from '../hooks/useMostrarContrasena'

function tokenDeUrl() {
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

function ReglasPassword({ valor }) {
  if (!valor) return null
  const reglas = reglasContrasena(valor)
  return (
    <div className="mt-2 flex flex-col gap-1">
      {reglas.map(r => (
        <div key={r.texto} className={`flex items-center gap-1.5 text-[12px] ${r.ok ? 'text-[#00C982]' : 'text-[#64748B]'}`}>
          <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px]
            ${r.ok ? 'bg-[rgba(0,201,130,0.15)]' : 'bg-white/[0.05]'}`}>
            {r.ok ? '✓' : '●'}
          </span>
          {r.texto}
        </div>
      ))}
    </div>
  )
}

function CampoTexto({ id, label, valor, onChange, placeholder, tipo = 'text', autoComplete, disabled }) {
  const [visible, alternarVisible] = useMostrarContrasena()
  const [enfocado, setEnfocado] = useState(false)
  const esPassword = tipo === 'password'
  const tipoFinal = esPassword ? (visible ? 'text' : 'password') : tipo

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#43474f] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={tipoFinal}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          className={`w-full px-4 py-3 rounded-xl text-[#0b1c30] text-[15px] font-sans outline-none box-border transition-all duration-150 bg-white
            ${enfocado
              ? 'border-[2px] border-[#001430] shadow-[0_0_0_4px_rgba(0,20,48,0.08)]'
              : 'border-[1.5px] border-[#c4c6d0]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${esPassword ? 'pr-11' : ''}`}
        />
        {esPassword && (
          <button
            type="button"
            onClick={alternarVisible}
            tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#747780] flex items-center p-0.5"
          >
            {visible ? <IcoOjoTachado /> : <IcoOjo />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Activar() {
  const token = tokenDeUrl()

  const [paso, setPaso] = useState(1)       // 1: email, 2: nombre + clave, 3: éxito
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState(null)    // { nombreNegocio, plan }
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  // Si no hay token en la URL, mostrar error inmediato
  const sinToken = !token

  const passwordValido = contrasenaEsValida(password)
  const coinciden = password === confirmar && confirmar !== ''

  async function verificarEmail(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/activar/verificar', {
        method: 'POST',
        body: { token, email },
      })
      if (!ok) { setError(datos.error || 'Error al verificar.'); return }
      setInfo({ nombreNegocio: datos.nombreNegocio, plan: datos.plan })
      setPaso(2)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function completarActivacion(e) {
    e.preventDefault()
    setError('')
    if (!nombreCompleto.trim()) { setError('El nombre es requerido.'); return }
    if (!passwordValido) { setError('La contraseña no cumple los requisitos mínimos.'); return }
    if (!coinciden) { setError('Las contraseñas no coinciden.'); return }

    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/activar/completar', {
        method: 'POST',
        body: { token, email, nombreCompleto, password },
      })
      if (!ok) { setError(datos.error || 'Error al activar.'); return }
      setPaso(3)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#f8f9ff] flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* Header mínimo */}
      <header className="px-6 py-5 flex items-center">
        <img src="/logotipo_sin slogan.webp" alt="GotaPay" className="h-12 w-auto" />
      </header>

      {/* Contenido centrado */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">

          {sinToken ? (
            <div className="bg-white rounded-2xl border border-[#c4c6d0] shadow-[0_4px_24px_rgba(0,40,85,0.08)] p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h1 className="text-[20px] font-bold text-[#0b1c30] mb-2">Enlace inválido</h1>
              <p className="text-[14px] text-[#43474f] leading-relaxed">
                Este enlace de activación no es válido o ya fue usado. Contacta al administrador para obtener uno nuevo.
              </p>
            </div>
          ) : paso === 3 ? (
            /* Éxito */
            <div className="bg-white rounded-2xl border border-[#c4c6d0] shadow-[0_4px_24px_rgba(0,40,85,0.08)] p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(0,201,130,0.12)] flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#006d43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-[22px] font-bold text-[#0b1c30] mb-2 tracking-[-0.01em]">
                ¡Cuenta activada!
              </h1>
              <p className="text-[14px] text-[#43474f] leading-relaxed mb-6">
                Tu cuenta en <strong>{info?.nombreNegocio}</strong> está lista. Ya puedes iniciar sesión en el panel.
              </p>
              <a
                href="/login"
                className="block w-full py-3 rounded-xl bg-[#001430] text-white text-[15px] font-bold text-center no-underline transition-opacity hover:opacity-90"
              >
                Ir al panel →
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#c4c6d0] shadow-[0_4px_24px_rgba(0,40,85,0.08)] overflow-hidden">

              {/* Cabecera de la card */}
              <div className="px-8 pt-8 pb-6 border-b border-[#e5eeff]">
                <p className="text-[11px] font-bold text-[#006d43] uppercase tracking-[0.1em] mb-2">Activación de cuenta</p>
                <h1 className="text-[22px] font-bold text-[#0b1c30] m-0 tracking-[-0.01em] leading-snug">
                  {paso === 1 ? 'Verifica tu email' : `Bienvenido a ${info?.nombreNegocio}`}
                </h1>
                {paso === 1 && (
                  <p className="text-[14px] text-[#43474f] mt-2 mb-0 leading-relaxed">
                    Ingresa el email con el que te registraron para continuar.
                  </p>
                )}
                {paso === 2 && info && (
                  <p className="text-[14px] text-[#43474f] mt-2 mb-0 leading-relaxed">
                    Plan <strong>{info.plan}</strong> · Completa los datos para acceder.
                  </p>
                )}
              </div>

              {/* Indicador de pasos */}
              <div className="flex border-b border-[#e5eeff]">
                {['Verificar email', 'Crear acceso'].map((etiqueta, i) => (
                  <div
                    key={etiqueta}
                    className={`flex-1 py-3 text-center text-[12px] font-semibold transition-colors
                      ${paso > i + 1
                        ? 'text-[#006d43] border-b-2 border-[#006d43]'
                        : paso === i + 1
                          ? 'text-[#001430] border-b-2 border-[#001430]'
                          : 'text-[#c4c6d0]'
                      }`}
                  >
                    {paso > i + 1 ? `✓ ${etiqueta}` : `${i + 1}. ${etiqueta}`}
                  </div>
                ))}
              </div>

              {/* Formulario */}
              <div className="px-8 py-7">

                {paso === 1 && (
                  <form onSubmit={verificarEmail} noValidate className="flex flex-col gap-5">
                    <CampoTexto
                      id="email"
                      label="Email registrado"
                      valor={email}
                      onChange={v => { setEmail(v); setError('') }}
                      placeholder="tu@email.com"
                      tipo="email"
                      autoComplete="email"
                    />

                    {error && (
                      <div className="bg-[#ffdad6] border border-[rgba(186,26,26,0.2)] rounded-xl px-4 py-3 text-[13px] text-[#93000a]">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={enviando || !email}
                      className="w-full py-3.5 rounded-xl bg-[#001430] text-white text-[15px] font-bold border-none cursor-pointer font-sans flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    >
                      {enviando ? (
                        <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />Verificando...</>
                      ) : 'Verificar email →'}
                    </button>
                  </form>
                )}

                {paso === 2 && (
                  <form onSubmit={completarActivacion} noValidate className="flex flex-col gap-5">
                    <CampoTexto
                      id="nombre"
                      label="Tu nombre completo"
                      valor={nombreCompleto}
                      onChange={v => { setNombreCompleto(v); setError('') }}
                      placeholder="Ej: María García"
                      autoComplete="name"
                    />

                    <div>
                      <CampoTexto
                        id="password"
                        label="Contraseña"
                        valor={password}
                        onChange={v => { setPassword(v); setError('') }}
                        placeholder="••••••••"
                        tipo="password"
                        autoComplete="new-password"
                      />
                      <ReglasPassword valor={password} />
                    </div>

                    <div>
                      <CampoTexto
                        id="confirmar"
                        label="Confirmar contraseña"
                        valor={confirmar}
                        onChange={v => { setConfirmar(v); setError('') }}
                        placeholder="••••••••"
                        tipo="password"
                        autoComplete="new-password"
                      />
                      {confirmar && (
                        <p className={`mt-1.5 text-[12px] ${coinciden ? 'text-[#006d43]' : 'text-[#ba1a1a]'}`}>
                          {coinciden ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="bg-[#ffdad6] border border-[rgba(186,26,26,0.2)] rounded-xl px-4 py-3 text-[13px] text-[#93000a]">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setPaso(1); setError('') }}
                        className="px-5 py-3.5 rounded-xl border border-[#c4c6d0] bg-white text-[#43474f] text-[14px] font-semibold cursor-pointer font-sans hover:bg-[#f8f9ff] transition-colors"
                      >
                        ← Volver
                      </button>
                      <button
                        type="submit"
                        disabled={enviando}
                        className="flex-1 py-3.5 rounded-xl bg-[#56fbab] text-[#001430] text-[15px] font-bold border-none cursor-pointer font-sans flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                      >
                        {enviando ? (
                          <><span className="w-4 h-4 rounded-full border-2 border-[#001430]/20 border-t-[#001430] animate-spin inline-block" />Activando...</>
                        ) : 'Activar mi cuenta'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-[12px] text-[#747780] mt-6">
            ¿Problemas con la activación?{' '}
            <a href="/soporte" className="text-[#001430] font-semibold no-underline hover:underline">
              Contacta soporte
            </a>
          </p>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-[12px] text-[#747780]">
        © {new Date().getFullYear()} GotaPay · Crédito informal, gestionado con tecnología
      </footer>
    </div>
  )
}
