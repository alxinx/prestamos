import CampoFormulario, { obtenerClaseInput } from './CampoFormulario'

// Textarea DRY con contador de caracteres opcional (cuando se define maxLength).
export default function CampoTextarea({
  etiqueta, valor, onChange, placeholder, error, requerido = false,
  maxLength, filas = 4, name, disabled = false,
}) {
  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <textarea
        name={name}
        value={valor}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={requerido}
        maxLength={maxLength}
        disabled={disabled}
        rows={filas}
        className={`${obtenerClaseInput({ error: !!error })} resize-none`}
      />
      {maxLength && (
        <p className="text-[11px] text-on-surface-variant/70 text-right mt-1">
          {valor.length} / {maxLength} caracteres
        </p>
      )}
    </CampoFormulario>
  )
}
