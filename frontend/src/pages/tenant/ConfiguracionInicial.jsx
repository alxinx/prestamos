import { useEffect, useState } from 'react'
import OnboardingLayout from '../../layouts/OnboardingLayout'
import PasoBienvenida from '../../components/tenant/onboardingWizard/PasoBienvenida'
import PasoCapital from '../../components/tenant/onboardingWizard/PasoCapital'
import PasoCobrador from '../../components/tenant/onboardingWizard/PasoCobrador'
import PasoListo from '../../components/tenant/onboardingWizard/PasoListo'
import { apiFetch } from '../../lib/api'

// Wizard de configuración inicial obligatorio — DashboardTenant.jsx ya
// garantiza que solo se llega acá si Tenant.onboardingCompletado es false.
// paso: 0 bienvenida, 1 capital, 2 cobrador, 3 listo. Al montar consulta el
// estado real (GET /api/tenant/onboarding/estado) para reanudar en el paso
// correcto si el admin ya había avanzado y refrescó la página.
export default function ConfiguracionInicial() {
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState(0)
  const [capital, setCapital] = useState(null)

  useEffect(() => {
    apiFetch('/api/tenant/onboarding/estado').then(({ ok, datos }) => {
      if (ok) {
        if (datos.tieneCapital && datos.tieneCobrador) setPaso(3)
        else if (datos.tieneCapital) setPaso(2)
      }
      setCargando(false)
    })
  }, [])

  if (cargando) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-[3px] border-secondary-container/30 [border-top-color:var(--color-secondary)] animate-[girar_0.8s_linear_infinite]" />
      </div>
    )
  }

  return (
    <OnboardingLayout paso={paso === 0 ? 1 : paso}>
      {paso === 0 && <PasoBienvenida onComenzar={() => setPaso(1)} />}
      {paso === 1 && <PasoCapital onCompletado={cap => { setCapital(cap); setPaso(2) }} />}
      {paso === 2 && <PasoCobrador onCompletado={() => setPaso(3)} />}
      {paso === 3 && <PasoListo capital={capital} />}
    </OnboardingLayout>
  )
}
