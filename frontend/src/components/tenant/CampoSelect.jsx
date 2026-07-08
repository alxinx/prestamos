import CampoFormulario, { obtenerClaseInput } from './CampoFormulario'
import { IcoChevronAbajo } from './iconos'

// Select DRY con flecha propia (oculta la nativa) — `opciones` es [{ value, label }].
export default function CampoSelect({
  etiqueta, valor, onChange, opciones = [], placeholder, error, requerido = false, name, disabled = false,
}) {
  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <div className="relative">
        <select
          name={name}
          value={valor}
          onChange={e => onChange(e.target.value)}
          required={requerido}
          disabled={disabled}
          className={`${obtenerClaseInput({ error: !!error, iconoDerecha: true })} appearance-none`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {opciones.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
          <IcoChevronAbajo />
        </span>
      </div>
    </CampoFormulario>
  )
}
