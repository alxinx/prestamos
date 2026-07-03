import { AuthProvider } from './context/AuthContext'
import LoginMasterAdmin from './pages/master-admin/Login'
import Dashboard from './pages/master-admin/Dashboard'
import Plans from './pages/master-admin/Plans'
import Tenants from './pages/master-admin/Tenants'
import TenantPanel from './pages/master-admin/TenantPanel'

function Rutas() {
  const ruta = window.location.pathname

  if (ruta === '/' || ruta.startsWith('/master-admin/login')) {
    return <LoginMasterAdmin />
  }

  if (ruta.startsWith('/master-admin/dashboard')) {
    return <Dashboard />
  }

  if (ruta.startsWith('/master-admin/plans')) {
    return <Plans />
  }

  if (/^\/master-admin\/tenants\/[^/]+\/panel/.test(ruta)) {
    return <TenantPanel />
  }

  if (ruta.startsWith('/master-admin/tenants')) {
    return <Tenants />
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontFamily: 'Hanken Grotesk, sans-serif', color: '#43474f' }}>
      404 — Página no encontrada
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}
