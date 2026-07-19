import Modal from './Modal'
import GridPlanes from './GridPlanes'

// Modal de "Planes disponibles" — misma fuente de datos que AvisoLimitePlan
// (GridPlanes, tabla Plan real), pero en modal en vez de bloque inline. Lo abre
// el botón "Subir de plan" de BloqueLimitePlan cuando el panel está deshabilitado
// por haber llegado al límite del plan.
export default function ModalPlanes({ usados, recurso, onCerrar }) {
  return (
    <Modal
      titulo="Planes disponibles"
      subtitulo="Elige el plan que mejor se adapte al crecimiento de tu negocio"
      onCerrar={onCerrar}
      ancho="1100px"
    >
      <GridPlanes usados={usados} recurso={recurso} />
      <p className="text-[12.5px] text-on-surface-variant text-center mt-6 mb-0">
        Para activar un plan nuevo o ampliar tu cupo, comunícate con nuestro equipo de servicio al cliente.
      </p>
    </Modal>
  )
}
