import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const ENDPOINTS = {
  prestamos: '/api/tenant/plan/limite-prestamos',
  colaboradores: '/api/tenant/plan/limite-colaboradores',
}

const ESTADO_INICIAL = { cargando: true, usados: 0, limite: 0, alcanzado: false }

// Cupo de un recurso (préstamos, colaboradores, ...) vs. el límite del plan del
// tenant — misma forma que consumen NuevoPrestamo.jsx y Colaboradores.jsx para
// reemplazar su formulario por AvisoLimitePlan al llegar al tope. `activo`
// controla si se consulta (ej. esperar a que carguen los permisos). `revalidar`
// permite volver a consultar tras una acción que cambia el cupo (crear un
// colaborador, etc.) sin depender de que se recargue la página.
export default function useLimitePlan(recurso, { activo = true } = {}) {
  const [estado, setEstado] = useState(ESTADO_INICIAL)

  const revalidar = useCallback(async () => {
    const { ok, datos } = await apiFetch(ENDPOINTS[recurso])
    if (ok) setEstado({ cargando: false, usados: datos.usados, limite: datos.limite, alcanzado: datos.alcanzado })
    else setEstado(e => ({ ...e, cargando: false }))
  }, [recurso])

  useEffect(() => {
    if (activo) revalidar()
  }, [activo, revalidar])

  return [estado, revalidar]
}
