import CampoTexto from '../CampoTexto'
import CampoSelect from '../CampoSelect'
import CampoTextarea from '../CampoTextarea'
import { IcoInfo, IcoPersonas, IcoBasura, IcoCheck, IcoEditar } from '../iconos'
import { inicialesDe, claseAvatar } from '../../../lib/avatar'

const RELACIONES = [
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'AMIGO', label: 'Amigo' },
  { value: 'COLEGA', label: 'Colega' },
  { value: 'VECINO', label: 'Vecino' },
  { value: 'OTRO', label: 'Otro' },
]
const ETIQUETA_RELACION = Object.fromEntries(RELACIONES.map(r => [r.value, r.label]))

const MAXIMO_REFERENCIAS = 2

// Paso 4 — opcional pero recomendado (a diferencia de ubicaciones, que exige al
// menos una). Mismo patrón de lista + panel de edición que el paso 3.
export default function Paso4Referencias({ referencias, indiceActivo, onSeleccionar, onAgregar, onEliminar, onActualizarActiva }) {
  const activa = indiceActivo != null ? referencias[indiceActivo] : null

  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 className="text-[15px] font-bold text-on-background m-0">Referencias personales — ReferenciaPersonal</h2>
        <span className="text-on-surface-variant/50"><IcoInfo /></span>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-5">
        Agrega de 1 a 2 referencias personales del cliente. Esta información es importante para la gestión de riesgo.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
        <div className="flex flex-col gap-3">
          {referencias.map((r, i) => (
            <div
              key={i}
              className={`relative p-4 rounded-xl border-2 transition-colors ${
                i === indiceActivo ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-lowest'
              }`}
            >
              {i === 0 && (
                <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container/25 text-on-secondary-container">
                  Principal
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${claseAvatar(i)}`}>
                  {r.nombreCompleto ? inicialesDe(r.nombreCompleto) : <IcoPersonas size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-on-background m-0 truncate">{r.nombreCompleto || 'Sin nombre'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-on-surface-variant">{r.telefono || '—'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-on-tertiary-container/12 text-on-tertiary-container">
                      {ETIQUETA_RELACION[r.relacionConCliente]}
                    </span>
                  </div>
                  {r.observaciones && <p className="text-[12px] text-on-surface-variant mt-1.5 m-0">{r.observaciones}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSeleccionar(i)}
                    aria-label="Editar referencia"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-default transition-colors"
                  >
                    <IcoEditar size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminar(i)}
                    aria-label="Eliminar referencia"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <IcoBasura size={13} />
                  </button>
                </div>
              </div>

              {i === indiceActivo && (
                <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col gap-3">
                  <CampoTexto etiqueta="Nombre completo *" valor={activa.nombreCompleto} onChange={v => onActualizarActiva('nombreCompleto', v)} placeholder="Ej. María López González" />
                  <div className="grid grid-cols-2 gap-3">
                    <CampoTexto etiqueta="Teléfono *" valor={activa.telefono} onChange={v => onActualizarActiva('telefono', v)} placeholder="Ej. 300 987 6543" />
                    <CampoSelect etiqueta="Relación *" valor={activa.relacionConCliente} onChange={v => onActualizarActiva('relacionConCliente', v)} opciones={RELACIONES} />
                  </div>
                  <CampoTextarea etiqueta="Observaciones (opcional)" valor={activa.observaciones} onChange={v => onActualizarActiva('observaciones', v)} placeholder="Ej. Hermana del cliente." filas={2} />
                </div>
              )}
            </div>
          ))}

          {referencias.length < MAXIMO_REFERENCIAS && (
            <button
              type="button"
              onClick={onAgregar}
              className="py-6 rounded-xl border-2 border-dashed border-secondary/40 text-secondary text-[13.5px] font-semibold cursor-pointer hover:bg-secondary-container/10 transition-colors flex flex-col items-center gap-1.5"
            >
              <span className="w-7 h-7 rounded-full border-2 border-secondary/40 flex items-center justify-center text-[16px]">+</span>
              Agregar otra referencia
            </button>
          )}
          <p className="text-[11px] text-on-surface-variant/80 text-center">
            Puedes agregar hasta {MAXIMO_REFERENCIAS} referencias personales.
          </p>

          {referencias.length === 0 && (
            <div className="rounded-xl bg-on-tertiary-container/8 p-4 flex items-start gap-3">
              <span className="text-on-tertiary-container shrink-0 mt-0.5"><IcoInfo size={16} /></span>
              <div>
                <p className="text-[13px] font-bold text-on-tertiary-container m-0 mb-0.5">Recomendado: agrega al menos 1 referencia</p>
                <p className="text-[12px] text-on-tertiary-container/90 m-0">
                  Las referencias ayudan a validar la información y mejoran el perfil de riesgo del cliente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-secondary-container/12 border border-secondary/20 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-7 h-7 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
              <IcoPersonas size={14} />
            </span>
            <p className="text-[13px] font-bold text-on-background m-0">¿Qué es una referencia?</p>
          </div>
          <p className="text-[12.5px] text-on-surface-variant mb-3 leading-relaxed">
            Una referencia personal es alguien que conoce al cliente y puede dar información sobre él en caso de ser necesario.
          </p>
          <p className="text-[12px] font-semibold text-on-background mb-1.5">Consejos:</p>
          <ul className="flex flex-col gap-1.5 m-0 pl-0 list-none">
            {['Asegúrate de que sea alguien cercano al cliente.', 'Preferiblemente familiar, amigo o vecino.', 'Verifica que el teléfono esté correcto.'].map(c => (
              <li key={c} className="flex items-start gap-1.5 text-[12px] text-on-surface-variant">
                <span className="text-secondary shrink-0 mt-0.5"><IcoCheck size={11} /></span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
