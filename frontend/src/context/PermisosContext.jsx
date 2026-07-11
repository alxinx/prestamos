import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useTenantAuth } from './TenantAuthContext'

const PermisosContext = createContext(null)

// Fetch único de permisos por sesión de panel — evita que cada componente que
// necesita chequear un permiso (MenuUsuario, ConPermiso, botones condicionales)
// dispare su propia petición a /api/tenant/auth/permisos.
//
// Además abre UNA sola conexión SSE a /api/tenant/auth/eventos (sin polling) para
// dos cosas en tiempo real: refrescar los permisos cuando el administrador los
// cambia (o cambia el rol), y cerrar la sesión al instante si desactiva a este
// colaborador.
export function PermisosProvider({ children }) {
  const { cerrarSesion } = useTenantAuth()
  const [permisos, setPermisos] = useState(new Set())
  const [esSuperAdmin, setEsSuperAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  const cargarPermisos = useCallback(() => {
    return apiFetch('/api/tenant/auth/permisos')
      .then(({ ok, datos }) => {
        if (!ok) return
        setPermisos(new Set(datos.permisos || []))
        setEsSuperAdmin(!!datos.esSuperAdmin)
      })
  }, [])

  useEffect(() => {
    cargarPermisos().finally(() => setCargando(false))
  }, [cargarPermisos])

  useEffect(() => {
    const eventos = new EventSource('/api/tenant/auth/eventos', { withCredentials: true })
    eventos.addEventListener('permisos-actualizados', cargarPermisos)
    eventos.addEventListener('cuenta-desactivada', () => cerrarSesion())
    return () => eventos.close()
  }, [cargarPermisos, cerrarSesion])

  function tienePermiso(codigo) {
    return esSuperAdmin || permisos.has(codigo)
  }

  return (
    <PermisosContext.Provider value={{ tienePermiso, cargando, esSuperAdmin }}>
      {children}
    </PermisosContext.Provider>
  )
}

export function usePermisosContexto() {
  return useContext(PermisosContext)
}
