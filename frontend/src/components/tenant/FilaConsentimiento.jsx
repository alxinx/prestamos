import { IcoCheck, IcoX } from './iconos'

// Fila "etiqueta: Sí/No" DRY para mostrar (no editar) un consentimiento ya
// otorgado — usada en el modal de confirmación del wizard de clientes y en el
// modal "Ver datos" del wizard de préstamos. Distinta de la fila editable de
// Paso5Consentimientos.jsx (ese es un toggle, este es solo lectura).
export default function FilaConsentimiento({ etiqueta, marcado }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-on-surface-variant">{etiqueta}</span>
      <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${marcado ? 'text-secondary' : 'text-on-surface-variant/70'}`}>
        {marcado ? <IcoCheck size={11} /> : <IcoX size={11} />} {marcado ? 'Sí' : 'No'}
      </span>
    </div>
  )
}
