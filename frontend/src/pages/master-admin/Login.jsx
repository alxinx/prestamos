import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { IcoCorreo, IcoCandado, IcoOjo, IcoOjoTachado, IcoCheck } from '../../components/iconos'
import { apiFetch } from '../../lib/api'
import { useMostrarContrasena } from '../../hooks/useMostrarContrasena'

const IconoIngreso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
)

export default function LoginMasterAdmin() {
  useAuth()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, alternarMostrarContrasena] = useMostrarContrasena()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const { ok, datos } = await apiFetch('/api/master-admin/auth/login', {
        method: 'POST',
        body: { email: correo, password: contrasena },
      })

      if (!ok) {
        setError(datos.error || 'Error al iniciar sesión')
        return
      }

      window.location.href = '/master-admin/dashboard'
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-surface-low via-background to-surface-default">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[448px] bg-surface-lowest rounded-xl shadow-[0_4px_32px_0_rgba(0,40,85,0.10)] px-10 pt-10 pb-8">

          <div className="flex justify-center mb-8">
            <img src="/logotipo_sin slogan.webp" alt="GotaPay" className="h-12 w-auto" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[22px] font-bold text-primary m-0 mb-1.5 tracking-[-0.01em]">
              Acceso Master Admin
            </h1>
            <p className="text-sm text-on-surface-variant m-0">
              Sistema de Gestión de Créditos y Cobranzas
            </p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container rounded-lg px-3.5 py-2.5 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate>
            <div className="mb-5">
              <label htmlFor="correo" className="block text-sm font-semibold text-primary mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  <IcoCorreo />
                </span>
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="admin@gotapay.com"
                  className="w-full py-3 pl-[42px] pr-3.5 text-[15px] text-on-background bg-surface-lowest border-[1.5px] border-outline-variant rounded-md outline-none font-sans transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,20,48,0.08)]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="contrasena" className="block text-sm font-semibold text-primary mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  <IcoCandado />
                </span>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-[42px] pr-[44px] text-[15px] text-on-background bg-surface-lowest border-[1.5px] border-outline-variant rounded-md outline-none font-sans transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,20,48,0.08)]"
                />
                <button
                  type="button"
                  onClick={alternarMostrarContrasena}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-outline p-0 flex items-center"
                >
                  {mostrarContrasena ? <IcoOjoTachado /> : <IcoOjo />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
                <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" />
                Recuérdame
              </label>
              <button type="button" className="text-sm text-primary bg-transparent border-none cursor-pointer font-medium p-0 font-sans">
                Olvidé mi contraseña
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className={`w-full py-3.5 text-[15px] font-semibold text-white rounded-md border-none flex items-center justify-center gap-2 font-sans transition-colors duration-150
                ${cargando ? 'bg-primary-container cursor-not-allowed' : 'bg-primary cursor-pointer hover:bg-primary-container'}`}
            >
              {cargando ? 'Verificando...' : (<>Iniciar Sesión <IconoIngreso /></>)}
            </button>
          </form>

          <div className="h-px bg-surface-default my-6" />

          <div className="flex justify-center gap-6">
            {['Encriptación Bancaria', 'Velocidad Fintech'].map(etiqueta => (
              <span key={etiqueta} className="flex items-center gap-1.5 text-[13px] text-on-secondary-container font-medium">
                <span className="bg-secondary-container rounded-full w-5 h-5 flex items-center justify-center text-on-secondary-container">
                  <IcoCheck />
                </span>
                {etiqueta}
              </span>
            ))}
          </div>

          <p className="text-center text-[12px] text-outline mt-6 mb-0 leading-relaxed">
            Esta es una terminal de acceso restringido para uso exclusivo de<br />administradores GotaPay.
          </p>
        </div>
      </div>

      <footer className="px-8 py-4 flex items-center justify-between border-t border-surface-default">
        <span className="text-[13px] text-outline">
          <strong className="text-primary">GotaPay Master</strong> © {new Date().getFullYear()} GotaPay. Infraestructura Fintech Segura.
        </span>
        <div className="flex gap-6">
          {['Política de Privacidad', 'Términos de Servicio', 'Seguridad'].map(enlace => (
            <a key={enlace} href="#" className="text-[13px] text-outline no-underline hover:text-primary transition-colors duration-150">
              {enlace}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
