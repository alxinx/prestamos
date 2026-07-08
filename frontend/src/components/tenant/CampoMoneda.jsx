import InputMoneda from '../ui/InputMoneda'
import CampoFormulario from './CampoFormulario'

// Input de monto DRY — reutiliza el formateo/parseo de InputMoneda (cursor-safe) con el
// prefijo de moneda como caja separada, según el sistema de diseño de GotaPay.
export default function CampoMoneda({
  etiqueta, valor, onChange, error, moneda = 'COP', placeholder = '0.00', disabled = false, name,
}) {
  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <div className={`flex items-stretch rounded-lg border-2 overflow-hidden transition-colors ${
        error ? 'border-error' : 'border-outline-variant focus-within:border-primary'
      }`}>
        <span className="flex items-center px-3 bg-surface-default text-on-surface-variant text-[13px] font-semibold border-r border-outline-variant shrink-0">
          {moneda}
        </span>
        <InputMoneda
          name={name}
          valor={valor}
          onChange={onChange}
          prefijo={null}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 px-3.5 py-2.5 text-[14px] text-on-background outline-none bg-surface-lowest placeholder:text-on-surface-variant/60 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </CampoFormulario>
  )
}
