import { useState } from 'react'
import TenantAuthLayout from '../../layouts/TenantAuthLayout'
import { apiFetch } from '../../lib/api'

export default function RecuperarContrasena() {
  const [email, setEmail]       = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [error, setError]       = useState('')

  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await apiFetch('/api/tenant/auth/recuperar', { method: 'POST', body: { email } })
      setEnviado(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TenantAuthLayout
      indicador="Tu cuenta, protegida"
      titulo={<>Recupera el acceso<br />a tu <span style={{ color: '#56fbab' }}>panel GotaPay.</span></>}
      descripcion="Ingresa el correo de tu cuenta y te enviaremos un enlace seguro para que puedas crear una nueva contraseña."
      pieIzq="🔒 El enlace expira en 1 hora y solo puede usarse una vez."
    >
      <a
        href="/login"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 32, fontWeight: 500 }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >
        ← Volver al inicio de sesión
      </a>

      {enviado ? (
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(86,251,171,0.1)', border: '1px solid rgba(86,251,171,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
            ✉️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Revisa tu email
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px', lineHeight: 1.7 }}>
            Ahí te daremos las instrucciones para recuperar tu contraseña.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>
              Si no ves el correo, revisa la carpeta de <strong style={{ color: 'rgba(255,255,255,0.4)' }}>spam</strong>.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              ¿Olvidaste tu contraseña?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <form onSubmit={manejarSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Email corporativo
              </label>
              <input
                type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="nombre@empresa.com" autoComplete="email" required
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#ffffff', fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(86,251,171,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(86,251,171,0.08)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(186,26,26,0.12)', border: '1px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#ff8a8a' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={enviando || !email}
              style={{ width: '100%', padding: '14px 20px', background: enviando || !email ? 'rgba(86,251,171,0.3)' : '#56fbab', border: 'none', borderRadius: 10, color: '#001430', fontSize: 15, fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif", cursor: enviando || !email ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s', letterSpacing: '-0.01em' }}
            >
              {enviando
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,20,48,0.25)', borderTopColor: '#001430', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Enviando...</>
                : 'Enviar instrucciones →'
              }
            </button>
          </form>
        </>
      )}
    </TenantAuthLayout>
  )
}
