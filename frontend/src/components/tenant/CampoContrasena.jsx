import CampoFormulario, { obtenerClaseInput } from './CampoFormulario'
import { IcoOjo, IcoOjoTachado, IcoCandado } from './iconos'
import { useMostrarContrasena } from '../../hooks/useMostrarContrasena'

// Input de contraseña DRY — candado a la izquierda, toggle de visibilidad a la derecha.
export default function CampoContrasena({
  etiqueta, valor, onChange, placeholder, error, requerido = false,
  autoComplete = 'new-password', name, disabled = false, minLength,
}) {
  const [visible, alternarVisible] = useMostrarContrasena()

  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
          <IcoCandado />
        </span>
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={requerido}
          disabled={disabled}
          minLength={minLength}
          className={obtenerClaseInput({ error: !!error, iconoIzquierda: true, iconoDerecha: true })}
        />
        <button
          type="button"
          onClick={alternarVisible}
          tabIndex={-1}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
        >
          {visible ? <IcoOjoTachado /> : <IcoOjo />}
        </button>
      </div>
    </CampoFormulario>
  )
}
