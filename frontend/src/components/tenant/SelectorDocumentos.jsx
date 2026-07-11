import FormularioAgregarDocumento from './FormularioAgregarDocumento'
import { formatearTamanoArchivo } from '../../lib/documentos'

// Selector de documentos DRY: nombre + archivo, agregar/quitar de una lista en memoria
// (se suben al backend junto con el resto del formulario al enviar).
export default function SelectorDocumentos({ documentos, onCambiar }) {
  function agregar({ nombre, archivo }) {
    onCambiar([...documentos, { id: `${Date.now()}-${Math.random()}`, nombre, archivo }])
    return { ok: true }
  }

  function quitar(id) {
    onCambiar(documentos.filter(d => d.id !== id))
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
        Agregar documentos
      </p>

      <FormularioAgregarDocumento onAgregar={agregar} />

      {documentos.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-3">
          {documentos.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-default text-[12px]">
              <span className="truncate font-medium text-on-background shrink-0 max-w-[35%]">{d.nombre}</span>
              <span className="truncate text-on-surface-variant flex-1">{d.archivo.name}</span>
              <span className="text-on-surface-variant shrink-0">{formatearTamanoArchivo(d.archivo.size)}</span>
              <button type="button" onClick={() => quitar(d.id)} className="text-error shrink-0 font-semibold">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
