import CampoFormulario, { obtenerClaseInput } from './CampoFormulario'

// Input de texto DRY (text/email/tel/etc) con ícono izquierdo opcional.
export default function CampoTexto({
  etiqueta, valor, onChange, tipo = 'text', icono, placeholder, error,
  requerido = false, autoComplete, name, disabled = false, maxLength, minLength,
}) {
  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <div className="relative">
        {icono && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
            {icono}
          </span>
        )}
        <input
          type={tipo}
          name={name}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={requerido}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          className={obtenerClaseInput({ error: !!error, iconoIzquierda: !!icono })}
        />
      </div>
    </CampoFormulario>
  )
}
