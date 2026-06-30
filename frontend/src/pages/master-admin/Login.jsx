import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'


const IconoCorreo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconoCandado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconoOjo = ({ abierto }) => abierto ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
)

const IconoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IconoIngreso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
)

const estiloInput = {
  width: '100%',
  padding: '12px 14px 12px 42px',
  fontSize: '15px',
  color: '#0b1c30',
  background: '#ffffff',
  border: '1.5px solid #c4c6d0',
  borderRadius: '0.5rem',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function alEnfocar(e) {
  e.target.style.borderColor = '#001430'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,20,48,0.08)'
}

function alDesEnfocar(e) {
  e.target.style.borderColor = '#c4c6d0'
  e.target.style.boxShadow = 'none'
}

export default function LoginMasterAdmin() {
  const { guardarToken } = useAuth()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const res = await fetch('/api/master-admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: correo, password: contrasena }),
      })

      const datos = await res.json()

      if (!res.ok) {
        setError(datos.error || 'Error al iniciar sesión')
        return
      }

      // Token solo en memoria — nunca en localStorage ni sessionStorage
      guardarToken(datos.accessToken)
      window.location.href = '/master-admin/dashboard'
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #eff4ff 0%, #f8f9ff 50%, #e5eeff 100%)' }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div style={{ width: '100%', maxWidth: '448px', background: '#ffffff', borderRadius: '1rem', boxShadow: '0 4px 32px 0 rgba(0,40,85,0.10)', padding: '2.5rem 2.5rem 2rem' }}>

          <div className="flex justify-center mb-8">
            <img
              src="/logotipo_sin slogan.webp"
              alt="GotaPay"
              style={{ height: '48px', width: 'auto' }}
            />
          </div>

          <div className="text-center mb-8">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#001430', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Acceso Master Admin
            </h1>
            <p style={{ fontSize: '14px', color: '#43474f', margin: 0 }}>
              Sistema de Gestión de Créditos y Cobranzas
            </p>
          </div>

          {error && (
            <div style={{ background: '#ffdad6', color: '#93000a', borderRadius: '0.5rem', padding: '10px 14px', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="correo" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#001430', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#747780', pointerEvents: 'none' }}>
                  <IconoCorreo />
                </span>
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="admin@gotapay.com"
                  style={estiloInput}
                  onFocus={alEnfocar}
                  onBlur={alDesEnfocar}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="contrasena" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#001430', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#747780', pointerEvents: 'none' }}>
                  <IconoCandado />
                </span>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...estiloInput, paddingRight: '44px' }}
                  onFocus={alEnfocar}
                  onBlur={alDesEnfocar}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(v => !v)}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#747780', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <IconoOjo abierto={mostrarContrasena} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#43474f' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#001430', cursor: 'pointer' }} />
                Recuérdame
              </label>
              <button type="button" style={{ fontSize: '14px', color: '#001430', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, fontFamily: 'inherit' }}>
                Olvidé mi contraseña
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{ width: '100%', padding: '13px', background: cargando ? '#002855' : '#001430', color: '#ffffff', fontSize: '15px', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: cargando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = '#002855' }}
              onMouseLeave={e => { if (!cargando) e.currentTarget.style.background = '#001430' }}
            >
              {cargando ? 'Verificando...' : (<>Iniciar Sesión <IconoIngreso /></>)}
            </button>
          </form>

          <div style={{ height: '1px', background: '#e5eeff', margin: '24px 0 20px' }} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            {['Encriptación Bancaria', 'Velocidad Fintech'].map(etiqueta => (
              <span key={etiqueta} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#007146', fontWeight: 500 }}>
                <span style={{ background: '#56fbab', borderRadius: '9999px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007146' }}>
                  <IconoCheck />
                </span>
                {etiqueta}
              </span>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#747780', marginTop: '24px', marginBottom: 0, lineHeight: '1.5' }}>
            Esta es una terminal de acceso restringido para uso exclusivo de<br />administradores GotaPay.
          </p>
        </div>
      </div>

      <footer style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e5eeff' }}>
        <span style={{ fontSize: '13px', color: '#747780' }}>
          <strong style={{ color: '#001430' }}>GotaPay Master</strong> © {new Date().getFullYear()} GotaPay. Secure Fintech Infrastructure.
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Security Whitepaper'].map(enlace => (
            <a key={enlace} href="#" style={{ fontSize: '13px', color: '#747780', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#001430'}
              onMouseLeave={e => e.target.style.color = '#747780'}
            >
              {enlace}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
