import { useState, useEffect } from 'react'
import TenantAuthLayout from '../../layouts/TenantAuthLayout'
import CampoPassword from '../../components/ui/CampoPassword'
import { reglasContrasena, contrasenaEsValida } from '../../lib/validacionContrasena'
import { apiFetch } from '../../lib/api'

function tokenDeUrl() {
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

function Regla({ ok, texto }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: ok ? '#56fbab' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, background: ok ? 'rgba(86,251,171,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${ok ? 'rgba(86,251,171,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
        {ok ? '✓' : '·'}
      </span>
      {texto}
    </div>
  )
}

export default function RestablecerContrasena() {
  const token = tokenDeUrl()

  const [password, setPassword]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState(false)
  const [cuenta, setCuenta]       = useState(5)

  const reglas = reglasContrasena(password)
  const coinciden = password === confirmar && confirmar !== ''
  const listo = contrasenaEsValida(password) && coinciden

  useEffect(() => {
    if (!exito) return
    if (cuenta <= 0) { window.location.href = '/login'; return }
    const t = setTimeout(() => setCuenta(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [exito, cuenta])

  async function manejarSubmit(e) {
    e.preventDefault()
    if (!listo) return
    setError('')
    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/tenant/auth/restablecer', {
        method: 'POST',
        body: { token, password },
      })
      if (!ok) { setError(datos.error || 'Error al restablecer.'); return }
      setExito(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TenantAuthLayout
      indicador="Crea una contraseña segura"
      titulo={<>Nueva contraseña<br />para tu <span style={{ color: '#56fbab' }}>cuenta GotaPay.</span></>}
      descripcion="Elige una contraseña fuerte que no uses en ningún otro servicio."
      pieIzq="🔒 Tus contraseñas se guardan cifradas — ni GotaPay puede verlas."
    >
      {!token ? (
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>Enlace inválido</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Este enlace no es válido o ya fue utilizado.
          </p>
          <a href="/recuperar-contrasena" style={{ display: 'inline-block', padding: '12px 28px', background: '#56fbab', borderRadius: 10, color: '#001430', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Solicitar nuevo enlace
          </a>
        </div>
      ) : exito ? (
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(86,251,171,0.1)', border: '1px solid rgba(86,251,171,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
            ✅
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
            ¡Contraseña actualizada!
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px', lineHeight: 1.7 }}>
            Redirigiendo al inicio de sesión...
          </p>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="#56fbab" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - cuenta / 5)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
              {cuenta}
            </span>
          </div>
          <a href="/login" style={{ display: 'inline-block', padding: '12px 28px', background: '#56fbab', borderRadius: 10, color: '#001430', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Ir al inicio de sesión →
          </a>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Nueva contraseña
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Debe cumplir los requisitos mínimos de seguridad.
            </p>
          </div>

          <form onSubmit={manejarSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <CampoPassword
              id="password"
              label="Nueva contraseña"
              valor={password}
              onChange={v => { setPassword(v); setError('') }}
              autoComplete="new-password"
            />

            {password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                {reglas.map(r => <Regla key={r.texto} ok={r.ok} texto={r.texto} />)}
              </div>
            )}

            <div>
              <CampoPassword
                id="confirmar"
                label="Confirmar contraseña"
                valor={confirmar}
                onChange={v => { setConfirmar(v); setError('') }}
                autoComplete="new-password"
              />
              {confirmar && (
                <p style={{ fontSize: 12, marginTop: 6, color: coinciden ? '#56fbab' : '#ff8a8a' }}>
                  {coinciden ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(186,26,26,0.12)', border: '1px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#ff8a8a' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={enviando || !listo}
              style={{ width: '100%', padding: '14px 20px', background: enviando || !listo ? 'rgba(86,251,171,0.3)' : '#56fbab', border: 'none', borderRadius: 10, color: '#001430', fontSize: 15, fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif", cursor: enviando || !listo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s', letterSpacing: '-0.01em' }}
            >
              {enviando
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,20,48,0.25)', borderTopColor: '#001430', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Guardando...</>
                : 'Guardar nueva contraseña →'
              }
            </button>
          </form>
        </>
      )}
    </TenantAuthLayout>
  )
}
