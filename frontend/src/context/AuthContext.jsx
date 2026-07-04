import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(false)
  const [cargando, setCargando]       = useState(true)
  const inicializado = useRef(false)

  const renovarToken = useCallback(async () => {
    try {
      const res = await fetch('/api/master-admin/auth/refresh', {
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
    await fetch('/api/master-admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setAutenticado(false)
  }

  return (
    <AuthContext.Provider value={{ autenticado, cargando, cerrarSesion, renovarToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
