import CampoSelect from '../CampoSelect'
import CampoTextarea from '../CampoTextarea'
import { IcoInfo } from '../iconos'

// Paso 2 — datos propios de este tenant (a diferencia del paso 1, que es
// ClienteGlobal). Todo opcional: un cliente puede registrarse sin zona ni
// cobrador asignado todavía.
export default function Paso2InformacionOperativa({ zonas, cobradores, valores, onCambiar }) {
  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 className="text-[15px] font-bold text-on-background m-0">Información operativa — Cliente</h2>
        <span className="text-on-surface-variant/50"><IcoInfo /></span>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-5">Define los datos operativos del cliente dentro de este tenant.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6 items-center">
        <div className="flex flex-col gap-4">
          <div>
            <CampoSelect
              etiqueta="Zona de cobertura (opcional)"
              valor={valores.zonaId}
              onChange={v => onCambiar('zonaId', v)}
              placeholder="Seleccionar zona de cobertura"
              opciones={zonas.map(z => ({ value: z.id, label: z.nombre }))}
            />
            <p className="text-[11.5px] text-on-surface-variant -mt-2.5">Selecciona la zona donde se encuentra el cliente.</p>
          </div>

          <div>
            <CampoSelect
              etiqueta="Cobrador asignado (opcional)"
              valor={valores.cobradorId}
              onChange={v => onCambiar('cobradorId', v)}
              placeholder="Seleccionar cobrador"
              opciones={cobradores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
            />
            <p className="text-[11.5px] text-on-surface-variant -mt-2.5">Asignar el cobrador responsable de este cliente.</p>
          </div>

          <div>
            <CampoTextarea
              etiqueta="Observaciones (opcional)"
              valor={valores.observaciones}
              onChange={v => onCambiar('observaciones', v)}
              placeholder="Escribe aquí cualquier información relevante sobre el cliente..."
              maxLength={2000}
              filas={4}
            />
            <p className="text-[11.5px] text-on-surface-variant mt-1">Información adicional que pueda ayudar en la gestión y seguimiento.</p>
          </div>
        </div>

        <img
          src="/iconos/e27e45ad-2159-483d-b65d-7ad5348c70a6.webp"
          alt=""
          className="hidden lg:block w-full max-w-[220px] justify-self-center select-none pointer-events-none"
        />
      </div>
    </div>
  )
}
