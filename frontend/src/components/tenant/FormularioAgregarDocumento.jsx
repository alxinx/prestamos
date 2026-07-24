import { useRef, useState } from 'react'
import { obtenerClaseInput } from './CampoFormulario'
import BotonSubirArchivo from './BotonSubirArchivo'
import { IcoMas } from './iconos'
import { ACCEPT_DOCUMENTOS, validarArchivoDocumento } from '../../lib/documentos'

// Fila DRY de "nombre + selector de archivo + botón agregar" — compartida entre
// SelectorDocumentos (arma una lista en memoria antes de crear el colaborador) y
// SeccionDocumentosColaborador (sube directo al backend), que antes duplicaban el
// mismo markup con solo el comportamiento de "agregar" distinto.
//
// `onAgregar({ nombre, archivo })` debe devolver `{ ok, error? }` — si `ok` es
// true, el formulario se limpia solo; si no, se muestra `error` debajo.
export default function FormularioAgregarDocumento({ onAgregar }) {
  const [nombre, setNombre] = useState('')
  const [archivoElegido, setArchivoElegido] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const inputArchivoRef = useRef(null)

  async function manejarAgregar() {
    const archivo = inputArchivoRef.current?.files?.[0]
    if (!nombre.trim()) { setError('Ponle un nombre al documento.'); return }
    if (!archivo) { setError('Selecciona un archivo.'); return }

    const errorArchivo = validarArchivoDocumento(archivo)
    if (errorArchivo) { setError(errorArchivo); return }

    setError('')
    setEnviando(true)
    const resultado = await onAgregar({ nombre: nombre.trim(), archivo })
    setEnviando(false)

    if (!resultado?.ok) { setError(resultado?.error || 'No se pudo agregar el documento.'); return }

    setNombre('')
    setArchivoElegido(null)
    if (inputArchivoRef.current) inputArchivoRef.current.value = ''
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError('') }}
          placeholder="Nombre del documento (ej. Cédula)"
          className={`${obtenerClaseInput()} sm:flex-1`}
        />
        <BotonSubirArchivo
          inputRef={inputArchivoRef}
          accept={ACCEPT_DOCUMENTOS}
          archivoElegido={archivoElegido}
          onChange={e => { setError(''); setArchivoElegido(e.target.files?.[0] ?? null) }}
        />
        <button
          type="button"
          onClick={manejarAgregar}
          disabled={enviando}
          aria-label="Agregar documento"
          title="Agregar documento"
          className="inline-flex items-center justify-center shrink-0 w-11 h-11 rounded-lg bg-secondary-container text-primary-fixed hover:brightness-95 active:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IcoMas size={18} />
        </button>
      </div>

      {error && <p className="text-[12px] text-error mt-1.5">{error}</p>}
      <p className="text-[11px] text-on-surface-variant/70 mt-1.5">
        PDF, Word/Excel/PowerPoint o imágenes (máx. 3 MB para imágenes).
      </p>
    </div>
  )
}
