import { IcoCheck } from './iconos'

// Checkbox DRY con caja propia (oculta la nativa) — check en secondary sobre fondo primary.
export default function Casilla({ etiqueta, marcado, onChange, disabled = false, name }) {
  return (
    <label className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        name={name}
        checked={marcado}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-colors shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 ${
        marcado ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant bg-surface-lowest'
      }`}>
        {marcado && <IcoCheck size={12} />}
      </span>
      {etiqueta && <span className="text-[14px] text-on-background">{etiqueta}</span>}
    </label>
  )
}
