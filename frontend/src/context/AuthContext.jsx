import { crearAuthContext } from './crearAuthContext'

const { Provider, useAuthContexto } = crearAuthContext({ prefijo: '/api/master-admin/auth' })

export const AuthProvider = Provider
export const useAuth = useAuthContexto
