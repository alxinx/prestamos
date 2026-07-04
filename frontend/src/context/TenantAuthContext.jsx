import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const TenantAuthContext = createContext(null)

export function TenantAuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true)
  const inicializado = useRef(false)

  const renovarToken = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) { setToken(null); return null }
      const datos = await res.json()
      setToken(datos.accessToken)
      return datos.accessToken
    } catch {
      setToken(null)
      return null
    }
  }, [])

  useEffect(() => {
    if (inicializado.current) return
    inicializado.current = true
    renovarToken().finally(() => setCargando(false))
  }, [renovarToken])

  const guardarToken = (nuevoToken) => setToken(nuevoToken)

  const cerrarSesion = async () => {
    await fetch('/api/tenant/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setToken(null)
    window.location.href = '/login'
  }

  return (
    <TenantAuthContext.Provider value={{ token, cargando, guardarToken, cerrarSesion, renovarToken }}>
      {children}
    </TenantAuthContext.Provider>
  )
}

export function useTenantAuth() {
  return useContext(TenantAuthContext)
}
