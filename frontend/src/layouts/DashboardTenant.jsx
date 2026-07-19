import { useEffect, useState } from 'react'
import { useTenantAuth } from '../context/TenantAuthContext'
import { PermisosProvider } from '../context/PermisosContext'
import SidebarTenant from '../components/tenant/Sidebar'
import TopbarTenant from '../components/tenant/Topbar'
import AvisoInactividad from '../components/tenant/AvisoInactividad'
import useTamanoPantalla from '../hooks/useTamanoPantalla'
import useInactividad from '../hooks/useInactividad'
import { apiFetch } from '../lib/api'

// Roles de oficina: se cierran por inactividad. Los cobradores operan en campo
// todo el día y no deben perder la sesión por no tocar la pantalla.
const ROLES_CON_CIERRE_POR_INACTIVIDAD = ['ADMINISTRADOR', 'SECRETARIA']

export default function DashboardTenant({ children }) {
  const { autenticado, cargando, cerrarSesion } = useTenantAuth()
  const rutaActiva = window.location.pathname
  const esMobil = useTamanoPantalla()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // onboardingCompletado arranca en null ("todavía no sabemos") a propósito —
  // si arrancara en true, se vería un parpadeo del dashboard real antes de
  // expulsar al wizard apenas resuelve /auth/me.
  const [infoUsuario, setInfoUsuario] = useState({ rol: '', nombreNegocio: '', onboardingCompletado: null })
  const enOnboarding = rutaActiva.startsWith('/configuracion-inicial')

  useEffect(() => {
    if (!autenticado) return
    apiFetch('/api/tenant/auth/me')
      .then(({ ok, datos }) => {
        if (ok) setInfoUsuario({ rol: datos.rol, nombreNegocio: datos.nombreNegocio, onboardingCompletado: datos.onboardingCompletado })
      })
      .catch(() => {})
  }, [autenticado])

  // Wizard de configuración inicial obligatorio (Capital + Cobrador mínimo):
  // bloquea todo el panel hasta completarse, y evita reabrir el wizard una vez
  // completado. Ver src/modules/tenant/onboarding/ en el backend.
  useEffect(() => {
    if (infoUsuario.onboardingCompletado === null) return
    if (!infoUsuario.onboardingCompletado && !enOnboarding) window.location.href = '/configuracion-inicial'
    if (infoUsuario.onboardingCompletado && enOnboarding) window.location.href = '/dashboard'
  }, [infoUsuario.onboardingCompletado, enOnboarding])

  const { mostrarAviso, segundosRestantes, continuarTrabajando } = useInactividad({
    activo: autenticado && ROLES_CON_CIERRE_POR_INACTIVIDAD.includes(infoUsuario.rol),
    alExpirar: cerrarSesion,
  })

  useEffect(() => {
    if (!esMobil) setMenuAbierto(false)
  }, [esMobil])

  useEffect(() => {
    if (!cargando && !autenticado) window.location.href = '/login'
  }, [autenticado, cargando])

  if (cargando || (autenticado && infoUsuario.onboardingCompletado === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tenant-bg">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-4 animate-[girar_0.8s_linear_infinite] border-[3px] border-secondary-container/20 [border-top-color:var(--color-secondary-container)]" />
          <p className="text-slate-400 text-sm m-0">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) return null

  // Wizard de configuración inicial: pantalla completa, sin sidebar/topbar ni
  // PermisosProvider (no hace falta ahí, el super admin ya salta todo permiso).
  if (enOnboarding) return <>{children}</>

  return (
    <PermisosProvider>
      <div className="flex min-h-screen font-sans bg-tenant-bg">
        {esMobil && menuAbierto && (
          <div
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          />
        )}

        <SidebarTenant
          rutaActiva={rutaActiva}
          rol={infoUsuario.rol}
          menuAbierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
        />

        <div className={`flex-1 flex flex-col min-w-0 ${esMobil ? '' : 'overflow-hidden'}`}>
          <TopbarTenant
            esMobil={esMobil}
            onToggleMenu={() => setMenuAbierto(v => !v)}
            nombreNegocio={infoUsuario.nombreNegocio}
            rol={infoUsuario.rol}
          />
          <main className={`flex-1 tenant-main ${esMobil ? '' : 'overflow-y-auto'}`}>{children}</main>
        </div>
      </div>

      {mostrarAviso && (
        <AvisoInactividad segundosRestantes={segundosRestantes} onContinuar={continuarTrabajando} />
      )}
    </PermisosProvider>
  )
}
