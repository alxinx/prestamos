import { useCallback, useEffect, useRef, useState } from 'react'

const MINUTOS_INACTIVIDAD_DEFAULT = 5

function minutosInactividad() {
  const minutos = Number(import.meta.env.LOGOUT_INACTIVITY_TIME)
  return minutos > 0 ? minutos : MINUTOS_INACTIVIDAD_DEFAULT
}

const DURACION_TOTAL_MS = minutosInactividad() * 60 * 1000
// El aviso siempre dura 2 minutos, salvo que el tiempo total configurado sea menor.
const DURACION_AVISO_MS = Math.min(2 * 60 * 1000, DURACION_TOTAL_MS)
const UMBRAL_THROTTLE_MS = 5000
const EVENTOS_ACTIVIDAD = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel']

/**
 * Cierra la sesión tras N minutos de inactividad (env LOGOUT_INACTIVITY_TIME, en
 * minutos — default 5), mostrando un aviso con cuenta regresiva en los últimos 2
 * minutos. Mientras el aviso está visible, la actividad pasiva del mouse/teclado
 * ya no lo reinicia — solo `continuarTrabajando()` (el botón "Regresar a trabajar")
 * lo hace, para que el aviso no desaparezca por un movimiento accidental antes de
 * que el usuario lo note.
 */
export default function useInactividad({ activo, alExpirar }) {
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(DURACION_AVISO_MS / 1000)

  const timeoutAvisoRef  = useRef(null)
  const timeoutLogoutRef = useRef(null)
  const intervaloRef     = useRef(null)
  const mostrandoRef     = useRef(false)
  const ultimoResetRef   = useRef(0)

  const limpiarTimers = useCallback(() => {
    clearTimeout(timeoutAvisoRef.current)
    clearTimeout(timeoutLogoutRef.current)
    clearInterval(intervaloRef.current)
  }, [])

  const iniciarConteo = useCallback(() => {
    limpiarTimers()
    mostrandoRef.current = false
    setMostrarAviso(false)

    timeoutAvisoRef.current = setTimeout(() => {
      mostrandoRef.current = true
      setMostrarAviso(true)
      setSegundosRestantes(DURACION_AVISO_MS / 1000)

      const limite = Date.now() + DURACION_AVISO_MS
      intervaloRef.current = setInterval(() => {
        setSegundosRestantes(Math.max(0, Math.round((limite - Date.now()) / 1000)))
      }, 1000)
    }, DURACION_TOTAL_MS - DURACION_AVISO_MS)

    timeoutLogoutRef.current = setTimeout(() => {
      limpiarTimers()
      alExpirar()
    }, DURACION_TOTAL_MS)
  }, [limpiarTimers, alExpirar])

  useEffect(() => {
    if (!activo) { limpiarTimers(); return }

    ultimoResetRef.current = Date.now()
    iniciarConteo()

    function alDetectarActividad() {
      if (mostrandoRef.current) return
      const ahora = Date.now()
      if (ahora - ultimoResetRef.current < UMBRAL_THROTTLE_MS) return
      ultimoResetRef.current = ahora
      iniciarConteo()
    }

    EVENTOS_ACTIVIDAD.forEach(ev => window.addEventListener(ev, alDetectarActividad, { passive: true }))
    return () => {
      EVENTOS_ACTIVIDAD.forEach(ev => window.removeEventListener(ev, alDetectarActividad))
      limpiarTimers()
    }
  }, [activo, iniciarConteo, limpiarTimers])

  return { mostrarAviso, segundosRestantes, continuarTrabajando: iniciarConteo }
}
