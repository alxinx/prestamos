import { useEffect, useState } from 'react'
import CampoContrasena from '../../components/tenant/CampoContrasena'
import BotonAccion from '../../components/tenant/BotonAccion'
import ListaReglasContrasena from '../../components/tenant/ListaReglasContrasena'
import { contrasenaEsValida } from '../../lib/validacionContrasena'
import { apiFetch } from '../../lib/api'

function datosDeUrl() {
  const params = new URLSearchParams(window.location.search)
  return { token: params.get('token') ?? '', email: params.get('email') ?? '' }
}

export default function ActivarColaborador() {
  const { token, email } = datosDeUrl()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(null) // { nombreCompleto, rol }
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  const coinciden = password === confirmar && confirmar !== ''
  const listo = contrasenaEsValida(password) && coinciden

  useEffect(() => {
    if (!token || !email) { setCargando(false); return }
    apiFetch('/api/activar-colaborador/verificar', { method: 'POST', body: { token, email } })
      .then(({ ok, datos }) => {
        if (!ok) { setError(datos.error || 'Enlace inválido.'); return }
        setInfo({ nombreCompleto: datos.nombreCompleto, rol: datos.rol })
      })
      .finally(() => setCargando(false))
  }, [token, email])

  async function manejarSubmit(e) {
    e.preventDefault()
    if (!listo) return
    setError('')
    setEnviando(true)
    try {
      const { ok, datos } = await apiFetch('/api/activar-colaborador/completar', {
        method: 'POST',
        body: { token, email, password },
      })
      if (!ok) { setError(datos.error || 'No se pudo activar la cuenta.'); return }
      setExito(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="px-6 py-5 flex items-center">
        <img src="/logotipo_sin slogan.webp" alt="GotaPay" className="h-12 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-8">

          {cargando ? (
            <p className="text-center text-[13px] text-on-surface-variant">Verificando enlace...</p>
          ) : exito ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-secondary-container/25 flex items-center justify-center mx-auto mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-[20px] font-bold text-on-background mb-2">¡Cuenta activada!</h1>
              <p className="text-[14px] text-on-surface-variant mb-6">Ya puedes iniciar sesión con tu correo y tu nueva contraseña.</p>
              <a href="/login" className="inline-block w-full py-3 rounded-lg bg-primary text-on-primary text-[14px] font-bold no-underline hover:brightness-125 transition-all">
                Ir al inicio de sesión →
              </a>
            </div>
          ) : !info ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h1 className="text-[20px] font-bold text-on-background mb-2">Enlace inválido</h1>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">
                {error || 'Este enlace de activación no es válido o ya fue usado. Contacta a tu administrador para obtener uno nuevo.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.1em] mb-2">Activación de cuenta</p>
              <h1 className="text-[22px] font-bold text-on-background mb-1 tracking-tight">Hola, {info.nombreCompleto}</h1>
              <p className="text-[14px] text-on-surface-variant mb-6">Crea tu contraseña para acceder al panel.</p>

              <form onSubmit={manejarSubmit} noValidate className="flex flex-col gap-4">
                <CampoContrasena
                  etiqueta="Nueva contraseña"
                  valor={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  requerido
                />

                <ListaReglasContrasena valor={password} />

                <div>
                  <CampoContrasena
                    etiqueta="Confirmar contraseña"
                    valor={confirmar}
                    onChange={setConfirmar}
                    autoComplete="new-password"
                    requerido
                  />
                  {confirmar && (
                    <p className={`text-[12px] mt-1.5 ${coinciden ? 'text-secondary' : 'text-error'}`}>
                      {coinciden ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
                )}

                <BotonAccion type="submit" variante="primario" disabled={!listo || enviando} cargando={enviando} className="w-full mt-1">
                  {enviando ? 'Guardando...' : 'Activar mi cuenta'}
                </BotonAccion>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
