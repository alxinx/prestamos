import { useEffect, useState } from 'react'
import { useTenantAuth } from '../context/TenantAuthContext'
import SidebarTenant from '../components/tenant/Sidebar'
import TopbarTenant from '../components/tenant/Topbar'
import useTamanoPantalla from '../hooks/useTamanoPantalla'

export default function DashboardTenant({ children }) {
  const { autenticado, cargando } = useTenantAuth()
  const rutaActiva = window.location.pathname
  const esMobil = useTamanoPantalla()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [infoUsuario, setInfoUsuario] = useState({ rol: '', nombreNegocio: '' })

  useEffect(() => {
    if (!autenticado) return
    fetch('/api/tenant/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setInfoUsuario({ rol: d.rol, nombreNegocio: d.nombreNegocio }) })
      .catch(() => {})
  }, [autenticado])

  useEffect(() => {
    if (!esMobil) setMenuAbierto(false)
  }, [esMobil])

  useEffect(() => {
    if (!cargando && !autenticado) window.location.href = '/login'
  }, [autenticado, cargando])

  if (cargando) {
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

  return (
    <div className="flex min-h-screen font-sans bg-tenant-bg">
      {esMobil && menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        />
      )}

      <SidebarTenant
        rutaActiva={rutaActiva}
        esMobil={esMobil}
        menuAbierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        rol={infoUsuario.rol}
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
  )
}
