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

// Sincroniza actividad entre pestañas del mismo navegador (mismo origen, misma
// cookie de sesión — CLAUDE.md §6, JWT vía cookie httpOnly compartida). Sin
// esto, una pestaña que quedaba quieta 5 minutos cerraba la sesión (POST
// /logout) aunque el usuario estuviera trabajando activamente en otra pestaña
// al mismo tiempo, porque cada pestaña solo escuchaba sus propios eventos de
// mouse/teclado. Bug reportado 2026-07-17.
const CANAL_ACTIVIDAD = 'gotapay-inactividad'

/**
 * Cierra la sesión tras N minutos de inactividad (env LOGOUT_INACTIVITY_TIME, en
 * minutos — default 5), mostrando un aviso con cuenta regresiva en los últimos 2
 * minutos. Mientras el aviso está visible, la actividad pasiva del mouse/teclado
 * ya no lo reinicia — solo `continuarTrabajando()` (el botón "Regresar a trabajar")
 * lo hace, para que el aviso no desaparezca por un movimiento accidental antes de
 * que el usuario lo note.
 *
 * La actividad (y el cierre de sesión) se transmiten a las demás pestañas del
 * mismo origen vía BroadcastChannel: actividad en cualquier pestaña reinicia el
 * conteo en todas, y si una pestaña efectivamente cierra la sesión por
 * inactividad, las demás se enteran de inmediato en vez de esperar su propio
 * timer con una sesión ya inválida.
 */
export default function useInactividad({ activo, alExpirar }) {
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(DURACION_AVISO_MS / 1000)

  const timeoutAvisoRef  = useRef(null)
  const timeoutLogoutRef = useRef(null)
  const intervaloRef     = useRef(null)
  const mostrandoRef     = useRef(false)
  const ultimoResetRef   = useRef(0)
  const canalRef         = useRef(null)

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
      // Avisa a las demás pestañas ANTES de cerrar sesión: el logout invalida
      // la cookie compartida (CLAUDE.md §6), así que sin este aviso una
      // pestaña activa se enteraría recién en su próxima llamada al API con
      // un 401 confuso, en vez de un cierre de sesión explícito e inmediato.
      canalRef.current?.postMessage({ tipo: 'sesion-cerrada' })
      alExpirar()
    }, DURACION_TOTAL_MS)
  }, [limpiarTimers, alExpirar])

  useEffect(() => {
    if (!activo) { limpiarTimers(); return }

    ultimoResetRef.current = Date.now()
    iniciarConteo()

    // BroadcastChannel no existe en navegadores muy viejos — degrada con
    // gracia al comportamiento anterior (por pestaña) si no está disponible.
    const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CANAL_ACTIVIDAD) : null
    canalRef.current = canal

    function alDetectarActividad() {
      if (mostrandoRef.current) return
      const ahora = Date.now()
      if (ahora - ultimoResetRef.current < UMBRAL_THROTTLE_MS) return
      ultimoResetRef.current = ahora
      iniciarConteo()
      canal?.postMessage({ tipo: 'actividad-detectada' })
    }

    function alRecibirMensaje(evento) {
      if (evento.data?.tipo === 'actividad-detectada') {
        // Actividad real en otra pestaña: siempre reinicia, incluso con el
        // aviso visible en esta — es justo la señal que faltaba (a diferencia
        // del throttle de arriba, que es para no reiniciar por ruido local).
        ultimoResetRef.current = Date.now()
        iniciarConteo()
      } else if (evento.data?.tipo === 'sesion-cerrada') {
        limpiarTimers()
        alExpirar()
      }
    }
    canal?.addEventListener('message', alRecibirMensaje)

    EVENTOS_ACTIVIDAD.forEach(ev => window.addEventListener(ev, alDetectarActividad, { passive: true }))
    return () => {
      EVENTOS_ACTIVIDAD.forEach(ev => window.removeEventListener(ev, alDetectarActividad))
      canal?.removeEventListener('message', alRecibirMensaje)
      canal?.close()
      canalRef.current = null
      limpiarTimers()
    }
  }, [activo, iniciarConteo, limpiarTimers, alExpirar])

  // continuarTrabajando (botón "Regresar a trabajar") también avisa a las
  // demás pestañas — sin esto, aceptar en una pestaña no evita que otra
  // muestre o dispare su propio cierre por inactividad.
  const continuarTrabajando = useCallback(() => {
    iniciarConteo()
    canalRef.current?.postMessage({ tipo: 'actividad-detectada' })
  }, [iniciarConteo])

  return { mostrarAviso, segundosRestantes, continuarTrabajando }
}
