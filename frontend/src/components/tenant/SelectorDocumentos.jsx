import { useRef, useState } from 'react'
import { obtenerClaseInput } from './CampoFormulario'
import BotonSubirArchivo from './BotonSubirArchivo'
import { IcoMas } from './iconos'

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const EXTENSIONES_OFFICE = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const EXTENSIONES_PDF = ['pdf']
const EXTENSIONES_PERMITIDAS = [...EXTENSIONES_IMAGEN, ...EXTENSIONES_OFFICE, ...EXTENSIONES_PDF]
const MAX_IMAGEN_BYTES = 3 * 1024 * 1024

function extensionDe(nombreArchivo) {
  const partes = nombreArchivo.split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : ''
}

// Validación de cortesía en el cliente — el backend vuelve a validar todo
// (incluyendo la firma binaria del archivo) antes de persistir nada.
function validarArchivo(archivo) {
  const extension = extensionDe(archivo.name)
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    return 'Solo se permiten documentos PDF, Office (Word/Excel/PowerPoint) o imágenes.'
  }
  if (EXTENSIONES_IMAGEN.includes(extension) && archivo.size > MAX_IMAGEN_BYTES) {
    return 'Las imágenes no pueden superar 3 MB.'
  }
  return null
}

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Selector de documentos DRY: nombre + archivo, agregar/quitar de una lista en memoria
// (se suben al backend junto con el resto del formulario al enviar).
export default function SelectorDocumentos({ documentos, onCambiar }) {
  const [nombre, setNombre] = useState('')
  const [archivoElegido, setArchivoElegido] = useState(null)
  const [error, setError] = useState('')
  const inputArchivoRef = useRef(null)

  function agregar() {
    const archivo = inputArchivoRef.current?.files?.[0]
    if (!nombre.trim()) { setError('Ponle un nombre al documento.'); return }
    if (!archivo) { setError('Selecciona un archivo.'); return }

    const errorArchivo = validarArchivo(archivo)
    if (errorArchivo) { setError(errorArchivo); return }

    onCambiar([...documentos, { id: `${Date.now()}-${Math.random()}`, nombre: nombre.trim(), archivo }])
    setNombre('')
    setError('')
    setArchivoElegido(null)
    inputArchivoRef.current.value = ''
  }

  function quitar(id) {
    onCambiar(documentos.filter(d => d.id !== id))
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
        Agregar documentos
      </p>

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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
          archivoElegido={archivoElegido}
          onChange={e => { setError(''); setArchivoElegido(e.target.files?.[0] ?? null) }}
        />
        <button
          type="button"
          onClick={agregar}
          aria-label="Agregar documento"
          title="Agregar documento"
          className="inline-flex items-center justify-center shrink-0 w-11 h-11 rounded-lg bg-secondary-container text-primary hover:brightness-95 active:brightness-90 transition-all"
        >
          <IcoMas size={18} />
        </button>
      </div>

      {error && <p className="text-[12px] text-error mt-1.5">{error}</p>}
      <p className="text-[11px] text-on-surface-variant/70 mt-1.5">
        PDF, Word/Excel/PowerPoint o imágenes (máx. 3 MB para imágenes).
      </p>

      {documentos.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-3">
          {documentos.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-default text-[12px]">
              <span className="truncate font-medium text-on-background shrink-0 max-w-[35%]">{d.nombre}</span>
              <span className="truncate text-on-surface-variant flex-1">{d.archivo.name}</span>
              <span className="text-on-surface-variant shrink-0">{formatearTamano(d.archivo.size)}</span>
              <button type="button" onClick={() => quitar(d.id)} className="text-error shrink-0 font-semibold">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
