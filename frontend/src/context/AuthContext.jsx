import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true)

  const renovarToken = useCallback(async () => {
    try {
      const res = await fetch('/api/master-admin/auth/refresh', {
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
    renovarToken().finally(() => setCargando(false))
  }, [renovarToken])

  const guardarToken = (nuevoToken) => setToken(nuevoToken)

  const cerrarSesion = async () => {
    await fetch('/api/master-admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, cargando, guardarToken, cerrarSesion, renovarToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
