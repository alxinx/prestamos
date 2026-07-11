import { reglasContrasena } from '../../lib/validacionContrasena'

// Checklist visual de reglas mínimas de contraseña (8 caracteres, mayúscula,
// número) — no se muestra hasta que el usuario empieza a escribir.
export default function ListaReglasContrasena({ valor }) {
  if (!valor) return null

  return (
    <div className="flex flex-col gap-1.5 px-3.5 py-3 bg-surface-default rounded-lg">
      {reglasContrasena(valor).map(r => (
        <div key={r.texto} className={`flex items-center gap-2 text-[12px] ${r.ok ? 'text-secondary' : 'text-on-surface-variant/60'}`}>
          <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] ${r.ok ? 'bg-secondary-container/40' : 'bg-outline-variant/20'}`}>
            {r.ok ? '✓' : '·'}
          </span>
          {r.texto}
        </div>
      ))}
    </div>
  )
}
