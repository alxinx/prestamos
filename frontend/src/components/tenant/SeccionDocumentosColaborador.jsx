import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { formatearTamanoArchivo } from '../../lib/documentos'
import SelectorDocumentos from './SelectorDocumentos'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import {
  IcoDescargar, IcoBasura, IcoArchivo,
  IcoArchivoImagen, IcoArchivoPdf, IcoArchivoWord, IcoArchivoExcel, IcoArchivoPowerPoint,
} from './iconos'

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const ICONO_POR_EXTENSION = {
  pdf: IcoArchivoPdf,
  doc: IcoArchivoWord, docx: IcoArchivoWord,
  xls: IcoArchivoExcel, xlsx: IcoArchivoExcel,
  ppt: IcoArchivoPowerPoint, pptx: IcoArchivoPowerPoint,
}

function iconoParaExtension(extension) {
  if (EXTENSIONES_IMAGEN.includes(extension)) return IcoArchivoImagen
  return ICONO_POR_EXTENSION[extension] || IcoArchivo
}

// Sección de documentos del colaborador en su panel: a la izquierda se arman varios
// documentos en memoria con SelectorDocumentos (mismo componente que usa el formulario
// de "Nuevo colaborador" — un "+" agrega más líneas) y un solo botón los sube todos; a
// la derecha, el listado de lo ya subido (con descarga y eliminación).
export default function SeccionDocumentosColaborador({ empleadoId }) {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [porEliminar, setPorEliminar] = useState(null)

  const [documentosNuevos, setDocumentosNuevos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState('')

  async function cargar() {
    setCargando(true)
    const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${empleadoId}/documentos`)
    if (ok) setDocumentos(datos.documentos || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [empleadoId])

  async function subirTodos() {
    if (documentosNuevos.length === 0) return
    setSubiendo(true)
    setErrorSubida('')

    const subidos = []
    const pendientes = []

    for (const d of documentosNuevos) {
      const formData = new FormData()
      formData.append('nombre', d.nombre)
      formData.append('archivo', d.archivo)

      const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${empleadoId}/documentos`, {
        method: 'POST',
        body: formData,
      })

      if (ok) subidos.push(datos.documento)
      else pendientes.push(d)
    }

    setSubiendo(false)
    setDocumentosNuevos(pendientes)
    if (subidos.length > 0) setDocumentos(actuales => [...subidos, ...actuales])
    if (pendientes.length > 0) setErrorSubida(`No se pudieron subir ${pendientes.length} documento(s). Revisa e intenta de nuevo.`)
  }

  async function descargar(documento) {
    const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${empleadoId}/documentos/${documento.id}/descargar`)
    if (ok && datos.url) window.open(datos.url, '_blank', 'noopener,noreferrer')
  }

  async function eliminar() {
    if (!porEliminar) return
    const { ok } = await apiFetch(`/api/tenant/colaboradores/${empleadoId}/documentos/${porEliminar.id}`, { method: 'DELETE' })
    if (ok) setDocumentos(actuales => actuales.filter(d => d.id !== porEliminar.id))
    setPorEliminar(null)
  }

  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-6">
      <h2 className="text-[15px] font-bold text-on-background mb-4">Documentos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Izquierda: agregar (varias líneas con "+") y subir */}
        <div>
          <SelectorDocumentos documentos={documentosNuevos} onCambiar={setDocumentosNuevos} />

          <BotonAccion
            onClick={subirTodos}
            disabled={documentosNuevos.length === 0}
            cargando={subiendo}
            className="w-full mt-3"
          >
            Subir {documentosNuevos.length > 0 ? `(${documentosNuevos.length})` : ''}
          </BotonAccion>
          {errorSubida && <p className="text-[12px] text-error mt-1.5">{errorSubida}</p>}
        </div>

        {/* Derecha: documentos ya cargados */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
            Documentos cargados
          </p>

          {cargando ? (
            <p className="text-[13px] text-on-surface-variant">Cargando documentos...</p>
          ) : documentos.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">Este colaborador no tiene documentos cargados.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {documentos.map(d => {
                const IconoTipo = iconoParaExtension(d.extension)
                return (
                  <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-default text-[13px]">
                    <span className="text-on-surface-variant shrink-0"><IconoTipo size={16} /></span>
                    <span className="truncate font-medium text-on-background flex-1">{d.nombreArchivo}</span>
                    <span className="text-on-surface-variant shrink-0 text-[12px]">{formatearTamanoArchivo(d.tamanioBytes || 0)}</span>
                    <button
                      type="button"
                      onClick={() => descargar(d)}
                      aria-label="Descargar documento"
                      title="Descargar"
                      className="shrink-0 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <IcoDescargar size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorEliminar(d)}
                      aria-label="Eliminar documento"
                      title="Eliminar"
                      className="shrink-0 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <IcoBasura size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {porEliminar && (
        <ModalConfirmacion
          tipo="advertencia"
          titulo="¿Eliminar este documento?"
          mensaje={<>Se eliminará <strong>{porEliminar.nombreArchivo}</strong> permanentemente. Esta acción no se puede deshacer.</>}
          textoConfirmar="Sí, eliminar"
          onConfirmar={eliminar}
          onCancelar={() => setPorEliminar(null)}
        />
      )}
    </div>
  )
}
