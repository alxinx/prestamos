import { useEffect, useState } from 'react'
import BotonAccion from '../BotonAccion'
import { IcoCheck, IcoEdificio, IcoPersonas, IcoCandado } from '../iconos'
import { apiFetch } from '../../../lib/api'
import { formatearPrecio } from '../../../lib/formato'

const PUNTOS_CONFETI = [
  { color: '#56fbab', top: -10, left: -70, giro: 15 },
  { color: '#478dff', top: 4, left: 64, giro: -20 },
  { color: '#f59e0b', top: -18, left: -90, giro: 45 },
  { color: '#ba1a1a', top: 10, left: 84, giro: -10 },
]

// Paso final: confirma en el backend que el onboarding quedó completo — nunca
// confía en que el frontend ya hizo todo, revalida en vivo (finalizarOnboarding
// en onboarding.service.js). Los botones usan window.location.href (no
// navegación SPA) a propósito: DashboardTenant.jsx solo relee
// onboardingCompletado al montar, así que hace falta una recarga completa
// para que deje de redirigir de vuelta acá.
export default function PasoListo({ capital }) {
  const [finalizando, setFinalizando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/tenant/onboarding/finalizar', { method: 'POST' }).then(({ ok, datos }) => {
      if (!ok) setError(datos.error || 'No se pudo finalizar la configuración.')
      setFinalizando(false)
    })
  }, [])

  return (
    <div className="max-w-[680px]">
      <div className="relative flex flex-col items-center text-center mb-8">
        {PUNTOS_CONFETI.map((p, i) => (
          <span
            key={i}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{ background: p.color, top: p.top, left: `calc(50% + ${p.left}px)`, transform: `rotate(${p.giro}deg)` }}
          />
        ))}
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-white mb-5">
          <IcoCheck size={34} />
        </div>
        <h1 className="text-[26px] font-bold text-on-background m-0 mb-2 tracking-tight">¡Todo está listo!</h1>
        <p className="text-[14px] text-on-surface-variant m-0 max-w-[380px]">
          Tu empresa ya puede comenzar a registrar préstamos.
        </p>
      </div>

      {error && (
        <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2 mb-4 text-center max-w-[420px] mx-auto">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <BotonAccion onClick={() => { window.location.href = '/prestamos/nuevo' }} disabled={finalizando} className="px-6">
          Registrar primer préstamo →
        </BotonAccion>
        <BotonAccion onClick={() => { window.location.href = '/dashboard' }} variante="secundario" disabled={finalizando} className="px-6">
          Ir al Dashboard
        </BotonAccion>
      </div>

      <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5 max-w-[380px] mx-auto">
        <p className="text-[13px] font-bold text-on-background m-0 mb-3">Resumen de tu configuración</p>
        <div className="flex flex-col gap-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-on-surface-variant"><IcoEdificio size={15} /> Capital disponible</span>
            <span className="font-bold text-on-background">{formatearPrecio(capital?.disponible ?? capital?.valorTotal ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-on-surface-variant"><IcoPersonas size={15} /> Cobradores</span>
            <span className="font-bold text-on-background">1</span>
          </div>
        </div>
      </div>

      <p className="text-[11.5px] text-on-surface-variant/70 text-center mt-6 flex items-center justify-center gap-1.5">
        <IcoCandado size={12} /> Tu información está segura con nosotros
      </p>
    </div>
  )
}
