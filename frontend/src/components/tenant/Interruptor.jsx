// Toggle switch DRY para preferencias booleanas.
export default function Interruptor({ etiqueta, activo, onChange, disabled = false }) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {etiqueta && <span className="text-[14px] text-on-background">{etiqueta}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        disabled={disabled}
        onClick={() => onChange(!activo)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${activo ? 'bg-secondary-container' : 'bg-outline-variant/60'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  )
}
