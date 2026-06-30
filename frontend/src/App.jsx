import { AuthProvider } from './context/AuthContext'
import LoginMasterAdmin from './pages/master-admin/Login'

function Rutas() {
  const ruta = window.location.pathname

  if (ruta === '/' || ruta.startsWith('/master-admin/login')) {
    return <LoginMasterAdmin />
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
