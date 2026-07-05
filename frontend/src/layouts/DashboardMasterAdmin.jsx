import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/masterAdmin/Sidebar'
import Topbar from '../components/masterAdmin/Topbar'
import useTamanoPantalla from '../hooks/useTamanoPantalla'

export default function DashboardMasterAdmin({ children }) {
  const { autenticado, cargando } = useAuth()
  const rutaActiva = window.location.pathname
  const esMobil = useTamanoPantalla()
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    if (!esMobil) setMenuAbierto(false)
  }, [esMobil])

  useEffect(() => {
    if (!cargando && !autenticado) window.location.href = '/'
  }, [autenticado, cargando])

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-[3px] border-[rgba(0,201,130,0.2)] [border-top-color:#00C982] animate-[girar_0.8s_linear_infinite] mx-auto mb-4" />
          <p className="text-slate-400 text-sm m-0">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) return null

  return (
    <div className="flex min-h-screen bg-admin-bg font-sans">
      {esMobil && menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        />
      )}

      <Sidebar
        rutaActiva={rutaActiva}
        esMobil={esMobil}
        menuAbierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar esMobil={esMobil} onToggleMenu={() => setMenuAbierto(v => !v)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
