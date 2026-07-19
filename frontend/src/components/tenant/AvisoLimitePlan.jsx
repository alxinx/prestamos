import { formatearLimite } from '../../lib/formato'
import { RECURSOS_LIMITE_PLAN } from '../../lib/limitePlan'
import { IcoAlerta } from './iconos'
import BarraProgreso from './BarraProgreso'
import GridPlanes from './GridPlanes'

// Descripción larga por recurso — el título y el campo del plan a comparar
// viven en RECURSOS_LIMITE_PLAN (compartido con BloqueLimitePlan); acá solo lo
// que es exclusivo del bloque completo (párrafo largo + imagen ilustrativa).
const DESCRIPCIONES = {
  prestamos: {
    descripcion: limite => (
      <>Tu plan actual permite hasta <strong className="text-on-background">{formatearLimite(limite)} préstamos activos</strong> al
      mismo tiempo, y ya los tienes todos en uso. Para seguir otorgando préstamos, mejora tu plan eligiendo una opción a
      continuación, o comunícate con nuestro equipo de servicio al cliente para ampliar el cupo de tu plan actual.</>
    ),
    imagen: '/iconos/mora.webp',
  },
  colaboradores: {
    descripcion: limite => (
      <>Tu plan actual permite hasta <strong className="text-on-background">{formatearLimite(limite)} colaboradores</strong> en tu
      equipo, y ya los tienes todos registrados. Para agregar más cobradores, secretarias u otros roles, mejora tu plan eligiendo
      una opción a continuación, o comunícate con nuestro equipo de servicio al cliente para ampliar el cupo de tu plan actual.</>
    ),
    imagen: '/iconos/users.webp',
  },
}

// Se muestra en vez del wizard "Nuevo préstamo" cuando el tenant ya alcanzó el
// límite de préstamos activos de su plan (ver NuevoPrestamo.jsx y
// GET /api/tenant/plan/limite-prestamos). Las tarjetas de planes (GridPlanes)
// vienen de la tabla Plan real (GET /api/tenant/plan/opciones) — nunca datos
// inventados. Para el panel "Colaboradores" se usa BloqueLimitePlan en su
// lugar (overlay compacto sobre el formulario deshabilitado, no este bloque).
export default function AvisoLimitePlan({ usados, limite, recurso = 'prestamos' }) {
  const { titulo } = RECURSOS_LIMITE_PLAN[recurso]
  const { descripcion, imagen } = DESCRIPCIONES[recurso]

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-6 sm:p-8 mb-8">
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
          <div className="relative w-24 h-24 shrink-0 rounded-full bg-error-container flex items-center justify-center text-error mx-auto sm:mx-0">
            <IcoAlerta size={40} />
          </div>

          <div className="flex-1 min-w-[240px]">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-on-background m-0 mb-2">{titulo}</h1>
            <p className="text-[13.5px] text-on-surface-variant leading-relaxed m-0 mb-4">
              {descripcion(limite)}
            </p>
            <BarraProgreso usados={usados} limite={limite} horizontal />
          </div>

          <img
            src={imagen}
            alt=""
            className="hidden lg:block w-28 h-28 shrink-0 select-none pointer-events-none"
          />
        </div>
      </div>

      <p className="text-[18px] font-bold text-on-background mb-1">Planes disponibles</p>
      <p className="text-[13px] text-on-surface-variant mb-4">Elige el plan que mejor se adapte al crecimiento de tu negocio.</p>

      <GridPlanes usados={usados} recurso={recurso} />

      <p className="text-[12.5px] text-on-surface-variant text-center mt-6">
        Para activar un plan nuevo o ampliar tu cupo, comunícate con nuestro equipo de servicio al cliente.
      </p>
    </div>
  )
}
