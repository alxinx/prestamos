import { AuthProvider } from './context/AuthContext'
import { TenantAuthProvider } from './context/TenantAuthContext'
import LoginMasterAdmin from './pages/master-admin/Login'
import Dashboard from './pages/master-admin/Dashboard'
import Plans from './pages/master-admin/Plans'
import PlanDetail from './pages/master-admin/PlanDetail'
import Tenants from './pages/master-admin/Tenants'
import TenantPanel from './pages/master-admin/TenantPanel'
import Activar from './pages/Activar'
import LoginTenant from './pages/tenant/Login'
import RecuperarContrasena from './pages/tenant/RecuperarContrasena'
import RestablecerContrasena from './pages/tenant/RestablecerContrasena'

function esMasterAdmin(ruta) {
  return ruta === '/' || ruta.startsWith('/master-admin')
}

function RutasMasterAdmin({ ruta }) {
  if (ruta === '/' || ruta.startsWith('/master-admin/login'))   return <LoginMasterAdmin />
  if (ruta.startsWith('/master-admin/dashboard'))               return <Dashboard />
  if (/^\/master-admin\/planes\/[^/]+/.test(ruta))             return <PlanDetail />
  if (ruta.startsWith('/master-admin/plans'))                   return <Plans />
  if (/^\/master-admin\/tenants\/[^/]+\/panel/.test(ruta))     return <TenantPanel />
  if (ruta.startsWith('/master-admin/tenants'))                 return <Tenants />
  return null
}

function RutasTenant({ ruta }) {
  if (ruta.startsWith('/login'))                    return <LoginTenant />
  if (ruta.startsWith('/recuperar-contrasena'))     return <RecuperarContrasena />
  if (ruta.startsWith('/restablecer-contrasena'))   return <RestablecerContrasena />
  return null
}

function Rutas() {
  const ruta = window.location.pathname

  if (ruta.startsWith('/activar')) return <Activar />

  if (esMasterAdmin(ruta)) {
    return (
      <AuthProvider>
        <RutasMasterAdmin ruta={ruta} />
      </AuthProvider>
    )
  }

  return (
    <TenantAuthProvider>
      <RutasTenant ruta={ruta} />
    </TenantAuthProvider>
  )
}

export default function App() {
  return <Rutas />
}
