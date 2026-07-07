import ChipEstado from './ChipEstado'

const ETIQUETAS_ROL = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIA: 'Secretaria',
  AUDITOR: 'Auditor',
  COBRADOR: 'Cobrador',
}

function iniciales(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

// Tarjeta DRY de colaborador — pensada para listas mobile-first (sin tabla ancha, sin scroll horizontal).
export default function TarjetaColaborador({ colaborador, onCambiarEstado, cambiando }) {
  const activo = colaborador.estado === 'ACTIVO'

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/50 bg-surface-lowest">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[13px] shrink-0">
        {iniciales(colaborador.nombreCompleto)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-[13px] font-semibold text-on-background truncate">{colaborador.nombreCompleto}</p>
          <ChipEstado estado={colaborador.estado} />
        </div>
        <p className="text-[12px] text-on-surface-variant truncate">
          {ETIQUETAS_ROL[colaborador.rol.nombre] || colaborador.rol.nombre}
          {colaborador.cargo ? ` · ${colaborador.cargo}` : ''}
        </p>
        <p className="text-[12px] text-on-surface-variant truncate">{colaborador.email}</p>
      </div>

      {!colaborador.esSuperAdmin && (
        <button
          onClick={() => onCambiarEstado(colaborador.id)}
          disabled={cambiando}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 ${
            activo ? 'bg-error/10 text-error hover:bg-error/15' : 'bg-secondary/10 text-secondary hover:bg-secondary/15'
          }`}
        >
          {cambiando ? '...' : activo ? 'Desactivar' : 'Activar'}
        </button>
      )}
    </div>
  )
}
