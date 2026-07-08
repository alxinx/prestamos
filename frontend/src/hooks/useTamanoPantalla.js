import { useState, useEffect } from 'react'

export default function useTamanoPantalla(breakpoint = 768) {
  const [esReducido, setEsReducido] = useState(() => window.innerWidth <= breakpoint)
  useEffect(() => {
    const actualizar = () => setEsReducido(window.innerWidth <= breakpoint)
    actualizar()
    window.addEventListener('resize', actualizar)
    return () => window.removeEventListener('resize', actualizar)
  }, [breakpoint])
  return esReducido
}
