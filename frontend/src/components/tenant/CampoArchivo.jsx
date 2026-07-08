import { useRef, useState } from 'react'
import CampoFormulario from './CampoFormulario'
import { IcoNube } from './iconos'

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Dropzone de archivos DRY (drag & drop + selección manual) — controlado por el padre vía
// `archivos` (array de File) y `onCambiar`.
export default function CampoArchivo({
  etiqueta, archivos = [], onCambiar, error, aceptar, multiple = false, maxSizeMB = 10, ayuda,
}) {
  const inputRef = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)

  function procesarArchivos(lista) {
    const nuevos = Array.from(lista).filter(a => a.size <= maxSizeMB * 1024 * 1024)
    onCambiar(multiple ? [...archivos, ...nuevos] : nuevos.slice(0, 1))
  }

  function quitarArchivo(indice) {
    onCambiar(archivos.filter((_, i) => i !== indice))
  }

  return (
    <CampoFormulario etiqueta={etiqueta} error={error}>
      <div
        onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={e => { e.preventDefault(); setArrastrando(false); procesarArchivos(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 text-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
          arrastrando ? 'border-primary bg-primary/5' : error ? 'border-error bg-error-container/10' : 'border-outline-variant hover:border-primary/50'
        }`}
      >
        <IcoNube />
        <p className="text-[13px] text-on-surface-variant">
          Arrastra y suelta tus archivos aquí o <span className="font-semibold text-on-background">haz clic para buscar</span>
        </p>
        {ayuda && <p className="text-[11px] text-on-surface-variant/70">{ayuda}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={aceptar}
          multiple={multiple}
          onChange={e => procesarArchivos(e.target.files)}
          className="hidden"
        />
      </div>

      {archivos.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-2">
          {archivos.map((archivo, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-default text-[12px]">
              <span className="truncate text-on-background">{archivo.name}</span>
              <span className="text-on-surface-variant shrink-0">{formatearTamano(archivo.size)}</span>
              <button type="button" onClick={e => { e.stopPropagation(); quitarArchivo(i) }} className="text-error shrink-0 font-semibold">✕</button>
            </li>
          ))}
        </ul>
      )}
    </CampoFormulario>
  )
}
