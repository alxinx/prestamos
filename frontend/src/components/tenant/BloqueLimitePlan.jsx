import { useState } from 'react'
import { RECURSOS_LIMITE_PLAN } from '../../lib/limitePlan'
import { IcoAlerta } from './iconos'
import BotonAccion from './BotonAccion'
import ModalPlanes from './ModalPlanes'

// Igual que ConPermiso (mismo lenguaje visual: contenido desenfocado + overlay
// centrado) pero para "llegaste al límite de tu plan" en vez de "no tienes
// permiso" — usado en el panel "Colaboradores" en vez del bloque completo
// AvisoLimitePlan (ese sigue siendo del wizard "Nuevo préstamo", de página
// completa). El botón "Subir de plan" abre ModalPlanes con las tarjetas reales.
export default function BloqueLimitePlan({ alcanzado, usados, limite, recurso, children }) {
  const [modalAbierto, setModalAbierto] = useState(false)

  if (!alcanzado) return children

  const { titulo } = RECURSOS_LIMITE_PLAN[recurso]

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-lowest/90 rounded-2xl text-center px-6 py-8">
        <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
          <IcoAlerta size={22} />
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-on-background m-0 mb-1 max-w-[280px]">{titulo}</p>
          <p className="text-[12px] text-on-surface-variant m-0 max-w-[280px]">
            Tu plan permite hasta {limite}, y ya los tienes todos en uso.
          </p>
        </div>
        <BotonAccion onClick={() => setModalAbierto(true)} className="mt-1">
          Subir de plan
        </BotonAccion>
      </div>

      {modalAbierto && (
        <ModalPlanes usados={usados} recurso={recurso} onCerrar={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
