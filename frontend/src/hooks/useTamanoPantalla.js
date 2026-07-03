import { useState, useEffect } from 'react'

export default function useTamanoPantalla() {
  const [esMobil, setEsMobil] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const actualizar = () => setEsMobil(window.innerWidth < 768)
    window.addEventListener('resize', actualizar)
    return () => window.removeEventListener('resize', actualizar)
  }, [])
  return esMobil
}
