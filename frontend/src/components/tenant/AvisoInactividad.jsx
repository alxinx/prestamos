import { createPortal } from 'react-dom'
import BotonAccion from './BotonAccion'
import { IcoReloj } from './iconos'

function formatearTiempo(segundos) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Aviso de cierre de sesión por inactividad — se muestra 2 minutos antes del
// cierre automático (ADMINISTRADOR/SECRETARIA, ver useInactividad). El fondo
// queda oscurecido/difuminado al 80% para que el aviso sea inevitable.
export default function AvisoInactividad({ segundosRestantes, onContinuar }) {
  return createPortal(
    <div className="fixed inset-0 z-[400] bg-on-background/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-surface-lowest rounded-2xl shadow-card-hover p-8 text-center animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4 text-on-error-container">
          <IcoReloj size={26} />
        </div>
        <h2 className="text-[18px] font-bold text-on-background m-0 mb-2">Tu sesión está por cerrarse</h2>
        <p className="text-[13px] text-on-surface-variant m-0 mb-5 leading-relaxed">
          Por inactividad, tu sesión se cerrará automáticamente en:
        </p>
        <p className="text-[36px] font-bold text-error m-0 mb-6 tabular-nums">{formatearTiempo(segundosRestantes)}</p>
        <BotonAccion onClick={onContinuar} variante="accion" className="w-full">
          Regresar a trabajar
        </BotonAccion>
      </div>
    </div>,
    document.body
  )
}
