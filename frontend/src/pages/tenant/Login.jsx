import { useState } from 'react'
import { useTenantAuth } from '../../context/TenantAuthContext'
import TenantAuthLayout from '../../layouts/TenantAuthLayout'
import CampoPassword from '../../components/ui/CampoPassword'
import { apiFetch } from '../../lib/api'

function IconoEmail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function IconoBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconoEscudo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconoRayo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

const features = [
  { icono: <IconoEscudo />, titulo: 'Protección bancaria',    desc: 'Cifrado AES-256 y autenticación multifactor para cada operación.' },
  { icono: <IconoRayo />,   titulo: 'Velocidad en tiempo real', desc: 'Registro y procesamiento de pagos en menos de 200ms.' },
]

const badges = ['PCI-DSS NIVEL 1', 'AES-256']

export default function LoginTenant() {
  useTenantAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError]       = useState('')

  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/tenant/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      if (!ok) { setError(datos.error || 'Error al iniciar sesión.'); return }
      window.location.href = '/dashboard'
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  const panelIzq = (
    <>
      <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', fontWeight: 700, color: '#ffffff', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 40 }}>
        Infraestructura Segura<br />
        para <span style={{ color: '#56fbab' }}>Administración de pagos.</span>
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
        {features.map(f => (
          <div key={f.titulo} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(86,251,171,0.1)', color: '#56fbab', border: '1px solid rgba(86,251,171,0.15)' }}>
              {f.icono}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', margin: '0 0 4px' }}>{f.titulo}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, display: 'flex', gap: 40 }}>
        {[{ valor: '99.99%', label: 'Uptime SLA' }, { valor: 'AES-256', label: 'Cifrado de datos' }].map(s => (
          <div key={s.label}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{s.valor}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <TenantAuthLayout indicador="Red activa" titulo={panelIzq} logoMobilCentrado>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Acceso al Panel
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Ingresa tus credenciales para continuar.
        </p>
      </div>

      <form onSubmit={manejarSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Email corporativo
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }}>
              <IconoEmail />
            </span>
            <input
              type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="nombre@empresa.com" autoComplete="email" required
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingRight: 16, paddingTop: 13, paddingBottom: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#ffffff', fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(86,251,171,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(86,251,171,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <a href="/recuperar-contrasena" style={{ fontSize: 12, fontWeight: 600, color: '#56fbab', textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <CampoPassword
            id="password"
            valor={password}
            onChange={v => { setPassword(v); setError('') }}
            autoComplete="current-password"
          />
        </div>

        {/* Recordar */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => setRecordar(v => !v)}
            style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer', border: recordar ? '2px solid #56fbab' : '1px solid rgba(255,255,255,0.2)', background: recordar ? '#56fbab' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          >
            {recordar && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#001430" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Recordar este equipo por 30 días</span>
        </label>

        {error && (
          <div style={{ background: 'rgba(186,26,26,0.12)', border: '1px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#ff8a8a' }}>
            {error}
          </div>
        )}

        <button
          type="submit" disabled={enviando || !email || !password}
          style={{ width: '100%', padding: '14px 20px', background: enviando || !email || !password ? 'rgba(86,251,171,0.3)' : '#56fbab', border: 'none', borderRadius: 10, color: '#001430', fontSize: 15, fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif", cursor: enviando || !email || !password ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s', letterSpacing: '-0.01em' }}
        >
          {enviando
            ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,20,48,0.25)', borderTopColor: '#001430', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Verificando...</>
            : <>Iniciar sesión en GotaPay <span style={{ fontSize: 17 }}>→</span></>
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
          ¿Nuevo en GotaPay?{' '}
          <a href="/registro" style={{ color: '#56fbab', fontWeight: 600, textDecoration: 'none' }}>Solicita acceso.</a>
        </p>
      </form>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
        {badges.map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(86,251,171,0.06)', border: '1px solid rgba(86,251,171,0.12)', borderRadius: 6, padding: '4px 8px' }}>
            <span style={{ color: '#56fbab' }}><IconoBadge /></span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(86,251,171,0.7)', letterSpacing: '0.05em' }}>{b}</span>
          </div>
        ))}
      </div>
    </TenantAuthLayout>
  )
}
