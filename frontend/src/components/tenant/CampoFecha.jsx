import CampoFormulario, { obtenerClaseInput } from './CampoFormulario'

// Input de fecha nativo DRY, estilizado igual que el resto de campos del tenant.
export default function CampoFecha({
  etiqueta, valor, onChange, error, requerido = false, name, min, max, disabled = false,
}) {
  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <input
        type="date"
        name={name}
        value={valor}
        onChange={e => onChange(e.target.value)}
        required={requerido}
        min={min}
        max={max}
        disabled={disabled}
        className={`${obtenerClaseInput({ error: !!error })} [color-scheme:light]`}
      />
    </CampoFormulario>
  )
}
