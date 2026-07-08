// Radio button DRY — se usa mapeando un array de opciones, comparando `value` contra el
// estado seleccionado en el formulario padre.
export default function RadioBoton({ etiqueta, seleccionado, onSeleccionar, disabled = false, name, value }) {
  return (
    <label className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={seleccionado}
        onChange={() => onSeleccionar(value)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 ${
        seleccionado ? 'border-primary' : 'border-outline-variant'
      }`}>
        {seleccionado && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      {etiqueta && <span className="text-[14px] text-on-background">{etiqueta}</span>}
    </label>
  )
}
