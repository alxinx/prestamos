import { crearAuthContext } from './crearAuthContext'

const { Provider, useAuthContexto } = crearAuthContext({
  prefijo: '/api/tenant/auth',
  alCerrarSesion: () => { window.location.href = '/login' },
})

export const TenantAuthProvider = Provider
export const useTenantAuth = useAuthContexto
