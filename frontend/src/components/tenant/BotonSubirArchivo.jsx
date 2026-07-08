import { useId } from 'react'
import { IcoSubir, IcoCheck } from './iconos'

// Botón de subir un solo archivo DRY — input nativo oculto detrás de un label estilizado
// (pill punteado) que cambia a estado "cargado" (borde sólido + check) una vez elegido.
export default function BotonSubirArchivo({
  inputRef, accept, archivoElegido, onChange,
  textoVacio = 'Subir archivo', textoCargado = 'Archivo cargado',
}) {
  const id = useId()

  return (
    <div className="flex items-center gap-2 min-w-0">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-[13px] font-semibold cursor-pointer transition-colors shrink-0 ${
          archivoElegido
            ? 'border-secondary bg-secondary-container/25 text-on-secondary-container'
            : 'border-dashed border-secondary/40 text-secondary hover:bg-secondary-container/10'
        }`}
      >
        {archivoElegido ? <IcoCheck size={14} /> : <IcoSubir size={16} />} {archivoElegido ? textoCargado : textoVacio}
      </label>
    </div>
  )
}
