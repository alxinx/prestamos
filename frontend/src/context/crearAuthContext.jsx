import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '../lib/api'

// Factory DRY para los contexts de autenticación (master-admin y tenant comparten la misma
// lógica de sesión — solo cambian el prefijo de las rutas y qué pasa al cerrar sesión).
export function crearAuthContext({ prefijo, alCerrarSesion }) {
  const Contexto = createContext(null)

  function Provider({ children }) {
    const [autenticado, setAutenticado] = useState(false)
    const [cargando, setCargando]       = useState(true)
    const inicializado = useRef(false)

    const renovarToken = useCallback(async () => {
      try {
        const { ok } = await apiFetch(`${prefijo}/refresh`, { method: 'POST' })
        setAutenticado(ok)
        return ok
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
      await apiFetch(`${prefijo}/logout`, { method: 'POST' }).catch(() => {})
      setAutenticado(false)
      alCerrarSesion?.()
    }

    return (
      <Contexto.Provider value={{ autenticado, cargando, cerrarSesion, renovarToken }}>
        {children}
      </Contexto.Provider>
    )
  }

  function useAuthContexto() {
    return useContext(Contexto)
  }

  return { Provider, useAuthContexto }
}
