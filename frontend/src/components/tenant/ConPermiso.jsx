import usePermisos from '../../hooks/usePermisos'
import { IcoCandado } from './iconos'

// Envuelve cualquier bloque (formulario, botón, etc.) y lo bloquea visualmente si
// el colaborador autenticado no tiene el permiso indicado: queda desenfocado y sin
// interacción, con un candado centrado encima. Mientras se resuelve el permiso, se
// muestra bloqueado por defecto (evita el parpadeo de contenido usable que luego
// se bloquea).
//
// `compacto` — para elementos chicos (botones, pills): candado sin texto ni
// círculo, y radio de esquina más chico a juego con el botón.
export default function ConPermiso({ permiso, children, compacto = false }) {
  const { tienePermiso, cargando } = usePermisos()
  const permitido = !cargando && tienePermiso(permiso)

  if (permitido) return children

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px]" aria-hidden="true">
        {children}
      </div>
      <div className={`absolute inset-0 flex items-center justify-center bg-surface-lowest/80 ${compacto ? 'rounded-lg' : 'rounded-2xl flex-col gap-2'}`}>
        {compacto ? (
          <IcoCandado size={16} />
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-surface-default flex items-center justify-center text-on-surface-variant shadow-card">
              <IcoCandado size={22} />
            </div>
            <p className="text-[12px] font-semibold text-on-surface-variant">No tienes permiso para esta acción</p>
          </>
        )}
      </div>
    </div>
  )
}
