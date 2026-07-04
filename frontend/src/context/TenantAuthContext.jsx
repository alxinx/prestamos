import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const TenantAuthContext = createContext(null)

export function TenantAuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(false)
  const [cargando, setCargando]       = useState(true)
  const inicializado = useRef(false)

  const renovarToken = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) { setAutenticado(false); return false }
      setAutenticado(true)
      return true
    } catch {
      setAutenticado(false)
      return false
    }
  }, [])

  useEffect(() => {
    if (inicializado.current) return
    inicializado.current = true
    renovarToken().finally(() => setCargando(false))
  }, [renovarToken])

  const cerrarSesion = async () => {
    await fetch('/api/tenant/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setAutenticado(false)
    window.location.href = '/login'
  }

  return (
    <TenantAuthContext.Provider value={{ autenticado, cargando, cerrarSesion, renovarToken }}>
      {children}
    </TenantAuthContext.Provider>
  )
}

export function useTenantAuth() {
  return useContext(TenantAuthContext)
}
