import { useEffect, useState } from 'react'

const CLAVE_TEMA = 'gotapay_tema'
const CONSULTA_SO = '(prefers-color-scheme: dark)'

function temaDelSistema() {
  return window.matchMedia(CONSULTA_SO).matches ? 'dark' : 'light'
}

// La elección explícita del usuario (localStorage) siempre gana; si nunca
// eligió una, se respeta el modo del sistema operativo.
function temaInicial() {
  const guardado = localStorage.getItem(CLAVE_TEMA)
  return guardado === 'light' || guardado === 'dark' ? guardado : temaDelSistema()
}

// Preferencia de tema claro/oscuro del panel tenant. Devuelve el valor
// actual para que quien llame lo aplique como atributo data-theme donde
// corresponda (DashboardTenant.jsx, escopado al área de contenido — nunca
// acá, para no filtrar el toggle hacia el panel master-admin, ver
// index.css). Mientras el usuario no haya elegido explícitamente, sigue el
// modo del sistema operativo EN VIVO (sin necesitar recargar la página) —
// en cuanto toca el toggle, esa elección persiste en localStorage y el
// sistema deja de tener efecto.
export default function useTema() {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    const media = window.matchMedia(CONSULTA_SO)
    function alCambiarSO() {
      if (!localStorage.getItem(CLAVE_TEMA)) setTema(temaDelSistema())
    }
    media.addEventListener('change', alCambiarSO)
    return () => media.removeEventListener('change', alCambiarSO)
  }, [])

  function alternarTema() {
    setTema(actual => {
      const siguiente = actual === 'dark' ? 'light' : 'dark'
      localStorage.setItem(CLAVE_TEMA, siguiente)
      return siguiente
    })
  }

  return { tema, alternarTema }
}
