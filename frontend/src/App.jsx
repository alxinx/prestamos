import { AuthProvider } from './context/AuthContext'
import { TenantAuthProvider } from './context/TenantAuthContext'

// Master Admin
import LoginMasterAdmin from './pages/master-admin/Login'
import Dashboard from './pages/master-admin/Dashboard'
import Plans from './pages/master-admin/Plans'
import PlanDetail from './pages/master-admin/PlanDetail'
import Tenants from './pages/master-admin/Tenants'
import TenantPanel from './pages/master-admin/TenantPanel'

// Tenant — auth pública
import Activar from './pages/Activar'
import LoginTenant from './pages/tenant/Login'
import RecuperarContrasena from './pages/tenant/RecuperarContrasena'
import RestablecerContrasena from './pages/tenant/RestablecerContrasena'

// Tenant — panel privado
import DashboardTenant from './pages/tenant/Dashboard'
import Clientes from './pages/tenant/Clientes'
import Prestamos from './pages/tenant/Prestamos'
import Cobros from './pages/tenant/Cobros'
import Colaboradores from './pages/tenant/Colaboradores'
import Capital from './pages/tenant/Capital'
import Tesoreria from './pages/tenant/Tesoreria'
import Reportes from './pages/tenant/Reportes'
import Configuracion from './pages/tenant/Configuracion'
import MisCobros from './pages/tenant/MisCobros'
import Historial from './pages/tenant/Historial'
import GastosCampo from './pages/tenant/GastosCampo'
import CierreCaja from './pages/tenant/CierreCaja'

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
  // Auth pública
  if (ruta.startsWith('/login'))                    return <LoginTenant />
  if (ruta.startsWith('/recuperar-contrasena'))     return <RecuperarContrasena />
  if (ruta.startsWith('/restablecer-contrasena'))   return <RestablecerContrasena />

  // Panel privado — administrador / secretaria / auditor
  if (ruta === '/dashboard')                        return <DashboardTenant />
  if (ruta.startsWith('/clientes'))                 return <Clientes />
  if (ruta.startsWith('/prestamos'))                return <Prestamos />
  if (ruta.startsWith('/cobros'))                   return <Cobros />
  if (ruta.startsWith('/colaboradores'))            return <Colaboradores />
  if (ruta.startsWith('/capital'))                  return <Capital />
  if (ruta.startsWith('/tesoreria'))                return <Tesoreria />
  if (ruta.startsWith('/reportes'))                 return <Reportes />
  if (ruta.startsWith('/configuracion'))            return <Configuracion />

  // Panel privado — cobrador
  if (ruta.startsWith('/mis-cobros'))               return <MisCobros />
  if (ruta.startsWith('/historial'))                return <Historial />
  if (ruta.startsWith('/caja/gastos'))              return <GastosCampo />
  if (ruta.startsWith('/caja/cierre'))              return <CierreCaja />

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
