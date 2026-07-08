import { useState } from 'react'

// Estado de mostrar/ocultar contraseña, compartido por los distintos campos de
// contraseña del tenant, master-admin y páginas de auth (antes cada uno declaraba
// su propio useState(false) + toggle).
export function useMostrarContrasena() {
  const [visible, setVisible] = useState(false)
  return [visible, () => setVisible(v => !v)]
}
